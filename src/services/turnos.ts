/**
 * Casos de uso de turnos. Reciben la base por parámetro para probarse contra
 * PostgreSQL en memoria (ver tests/).
 */
import { createHash, randomBytes } from "node:crypto";
import { and, asc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { especialidades, feriados, franjas, profesionales, servicios, turnos } from "@/db/schema";
import {
  diaReservable,
  fechaHora,
  fechaLocal,
  generarCodigo,
  generarHorarios,
  HORIZONTE_DIAS,
  MAX_TURNOS_FUTUROS,
  puedeCancelarPaciente,
  puedeRegistrarAsistencia,
  sumarDias,
  type DatosReserva,
  type Franja,
  type Intervalo,
  type Tipo,
} from "@/domain/agenda";

export class ErrorDeNegocio extends Error {}

const MIN = 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Especialidades con sus servicios y profesionales activos. */
export async function obtenerCatalogo(db: Db) {
  const [esp, serv, prof] = await Promise.all([
    db.select().from(especialidades).orderBy(asc(especialidades.orden)),
    db.select().from(servicios),
    db.select().from(profesionales).where(eq(profesionales.activo, true)).orderBy(asc(profesionales.nombre)),
  ]);
  return esp.map((e) => ({
    ...e,
    servicios: serv.filter((s) => s.especialidadId === e.id),
    profesionales: prof.filter((p) => p.especialidadId === e.id),
  }));
}

type Contexto = {
  servicio: typeof servicios.$inferSelect;
  profesionales: (typeof profesionales.$inferSelect & { franjas: Franja[] })[];
  ocupados: Map<number, Intervalo[]>;
  feriados: Set<string>;
};

/** Carga todo lo necesario para calcular horarios de una especialidad en un rango de fechas. */
async function cargarContexto(db: Db, params: { especialidadId: number; tipo: Tipo; desde: string; hasta: string }): Promise<Contexto> {
  const [servicio] = await db
    .select()
    .from(servicios)
    .where(and(eq(servicios.especialidadId, params.especialidadId), eq(servicios.tipo, params.tipo)));
  if (!servicio) throw new ErrorDeNegocio("Ese tipo de consulta no existe para la especialidad.");

  const profs = await db
    .select()
    .from(profesionales)
    .where(and(eq(profesionales.especialidadId, params.especialidadId), eq(profesionales.activo, true)))
    .orderBy(asc(profesionales.nombre));
  const ids = profs.map((p) => p.id);
  if (ids.length === 0) return { servicio, profesionales: [], ocupados: new Map(), feriados: new Set() };

  const [fr, tomados, fer] = await Promise.all([
    db.select().from(franjas).where(inArray(franjas.profesionalId, ids)),
    db
      .select({ profesionalId: turnos.profesionalId, inicio: turnos.inicio, fin: turnos.fin })
      .from(turnos)
      .where(
        and(
          inArray(turnos.profesionalId, ids),
          ne(turnos.estado, "CANCELADO"),
          gte(turnos.inicio, fechaHora(params.desde, "00:00")),
          lt(turnos.inicio, fechaHora(sumarDias(params.hasta, 1), "00:00")),
        ),
      ),
    db.select().from(feriados),
  ]);

  const ocupados = new Map<number, Intervalo[]>();
  for (const t of tomados) ocupados.set(t.profesionalId, [...(ocupados.get(t.profesionalId) ?? []), t]);

  return {
    servicio,
    profesionales: profs.map((p) => ({
      ...p,
      franjas: fr
        .filter((f) => f.profesionalId === p.id)
        .map((f) => ({ diaSemana: f.diaSemana, desde: f.desde.slice(0, 5), hasta: f.hasta.slice(0, 5) })),
    })),
    ocupados,
    feriados: new Set(fer.map((f) => f.fecha)),
  };
}

function horariosDe(ctx: Contexto, fecha: string, ahora: Date) {
  return ctx.profesionales.map((p) => ({
    profesional: { id: p.id, nombre: p.nombre, titulo: p.titulo, matricula: p.matricula },
    horarios: generarHorarios({
      fecha,
      franjas: p.franjas,
      duracionMin: ctx.servicio.duracionMin,
      ocupados: ctx.ocupados.get(p.id) ?? [],
      ahora,
      feriados: ctx.feriados,
    }),
  }));
}

/** RF-01 — Cantidad de horarios libres por día, para marcar el almanaque. */
export async function disponibilidadPorDia(
  db: Db,
  params: { especialidadId: number; tipo: Tipo; desde: string; hasta: string; ahora: Date },
) {
  const ctx = await cargarContexto(db, params);
  const resultado: Record<string, number> = {};
  for (let f = params.desde; f <= params.hasta; f = sumarDias(f, 1)) {
    resultado[f] = horariosDe(ctx, f, params.ahora).reduce((n, p) => n + p.horarios.length, 0);
  }
  return { disponibilidad: resultado, feriados: ctx.feriados, servicio: ctx.servicio };
}

/** RF-02 — Horarios libres de un día, agrupados por profesional. */
export async function horariosDelDia(db: Db, params: { especialidadId: number; tipo: Tipo; fecha: string; ahora: Date }) {
  const ctx = await cargarContexto(db, { ...params, desde: params.fecha, hasta: params.fecha });
  return { servicio: ctx.servicio, profesionales: horariosDe(ctx, params.fecha, params.ahora) };
}

/**
 * RF-03 / RF-04 — Reserva. Recalcula los horarios en el servidor (no confía en lo que
 * mandó el navegador) y bloquea al profesional dentro de la transacción para que dos
 * personas no puedan tomar el mismo horario a la vez (RN-04).
 */
export async function reservar(db: Db, datos: DatosReserva, ahora: Date = new Date()) {
  const inicio = new Date(datos.inicio);
  const fecha = fechaLocal(inicio);

  const [servicio] = await db.select().from(servicios).where(eq(servicios.id, datos.servicioId));
  const [profesional] = await db.select().from(profesionales).where(eq(profesionales.id, datos.profesionalId));
  if (!servicio || !profesional || servicio.especialidadId !== profesional.especialidadId) {
    throw new ErrorDeNegocio("Ese profesional no atiende ese tipo de consulta.");
  }

  const email = datos.email.toLowerCase();
  const [{ activos }] = await db
    .select({ activos: sql<number>`count(*)::int` })
    .from(turnos)
    .where(and(eq(turnos.pacienteEmail, email), eq(turnos.estado, "RESERVADO"), gte(turnos.inicio, ahora)));
  if (activos >= MAX_TURNOS_FUTUROS) {
    throw new ErrorDeNegocio(`Ya tenés ${MAX_TURNOS_FUTUROS} turnos pendientes. Cancelá uno para reservar otro.`);
  }

  const token = randomBytes(18).toString("base64url");

  const turno = await db.transaction(async (tx) => {
    // RN-04: serializa las reservas de este profesional.
    await tx.execute(sql`select id from profesionales where id = ${profesional.id} for update`);

    const ctx = await cargarContexto(tx as unknown as Db, {
      especialidadId: servicio.especialidadId,
      tipo: servicio.tipo,
      desde: fecha,
      hasta: fecha,
    });
    const libres = horariosDe(ctx, fecha, ahora).find((p) => p.profesional.id === profesional.id)?.horarios ?? [];
    if (!libres.some((h) => h.getTime() === inicio.getTime())) {
      throw new ErrorDeNegocio("Ese horario ya no está disponible. Elegí otro, por favor.");
    }

    for (let intento = 0; intento < 5; intento++) {
      const codigo = generarCodigo();
      const [creado] = await tx
        .insert(turnos)
        .values({
          codigo,
          profesionalId: profesional.id,
          servicioId: servicio.id,
          inicio,
          fin: new Date(inicio.getTime() + servicio.duracionMin * MIN),
          pacienteNombre: datos.nombre,
          pacienteEmail: email,
          pacienteTelefono: datos.telefono,
          cobertura: datos.cobertura,
          obraSocial: datos.cobertura === "OBRA_SOCIAL" ? datos.obraSocial : null,
          tokenHash: hashToken(token),
          creadoEn: ahora,
        })
        .onConflictDoNothing({ target: turnos.codigo })
        .returning();
      if (creado) return creado;
    }
    throw new Error("No se pudo generar un código único.");
  });

  return { turno, token };
}

export async function obtenerTurno(db: Db, codigo: string) {
  const [fila] = await db
    .select({
      turno: turnos,
      profesional: profesionales.nombre,
      titulo: profesionales.titulo,
      matricula: profesionales.matricula,
      especialidad: especialidades.nombre,
      especialidadSlug: especialidades.slug,
      tipo: servicios.tipo,
      duracionMin: servicios.duracionMin,
    })
    .from(turnos)
    .innerJoin(profesionales, eq(turnos.profesionalId, profesionales.id))
    .innerJoin(servicios, eq(turnos.servicioId, servicios.id))
    .innerJoin(especialidades, eq(servicios.especialidadId, especialidades.id))
    .where(eq(turnos.codigo, codigo.toUpperCase()));
  return fila;
}

/** RF-05 / RN-05 — Cancelación por el paciente con el link del comprobante. */
export async function cancelarPorPaciente(db: Db, params: { codigo: string; token: string }, ahora: Date = new Date()) {
  const fila = await obtenerTurno(db, params.codigo);
  if (!fila || fila.turno.tokenHash !== hashToken(params.token)) throw new ErrorDeNegocio("El link no es válido.");
  if (!puedeCancelarPaciente(fila.turno.estado, fila.turno.inicio, ahora)) {
    throw new ErrorDeNegocio("Falta menos de 24 h: para cancelar, llamá al consultorio.");
  }
  const [t] = await db
    .update(turnos)
    .set({ estado: "CANCELADO", actualizadoEn: ahora, motivoCancelacion: "Cancelado por el paciente" })
    .where(and(eq(turnos.id, fila.turno.id), eq(turnos.estado, "RESERVADO")))
    .returning();
  if (!t) throw new ErrorDeNegocio("El turno ya no estaba reservado.");
  return t;
}

/** RF-06 — Agenda de un día para el panel. */
export async function agendaDelDia(db: Db, fecha: string) {
  const [profs, delDia] = await Promise.all([
    db
      .select({ id: profesionales.id, nombre: profesionales.nombre, titulo: profesionales.titulo, especialidad: especialidades.nombre, slug: especialidades.slug })
      .from(profesionales)
      .innerJoin(especialidades, eq(profesionales.especialidadId, especialidades.id))
      .orderBy(asc(especialidades.orden), asc(profesionales.nombre)),
    db
      .select({ turno: turnos, tipo: servicios.tipo })
      .from(turnos)
      .innerJoin(servicios, eq(turnos.servicioId, servicios.id))
      .where(and(gte(turnos.inicio, fechaHora(fecha, "00:00")), lt(turnos.inicio, fechaHora(sumarDias(fecha, 1), "00:00"))))
      .orderBy(asc(turnos.inicio)),
  ]);
  return profs.map((p) => ({ ...p, turnos: delDia.filter((t) => t.turno.profesionalId === p.id) }));
}

/** RF-07 / RN-08 — Asistencia, solo sobre turnos reservados que ya empezaron. */
export async function registrarAsistencia(db: Db, params: { turnoId: number; estado: "ATENDIDO" | "AUSENTE" }, ahora: Date = new Date()) {
  const [t] = await db.select().from(turnos).where(eq(turnos.id, params.turnoId));
  if (!t) throw new ErrorDeNegocio("El turno no existe.");
  if (!puedeRegistrarAsistencia(t.estado, t.inicio, ahora)) {
    throw new ErrorDeNegocio(t.estado !== "RESERVADO" ? "Ese turno ya tiene un estado final." : "Todavía no empezó: la asistencia se marca desde su horario.");
  }
  const [act] = await db.update(turnos).set({ estado: params.estado, actualizadoEn: ahora }).where(eq(turnos.id, t.id)).returning();
  return act;
}

/** RF-07 — El consultorio puede cancelar en cualquier momento antes del turno, con motivo. */
export async function cancelarPorConsultorio(db: Db, params: { turnoId: number; motivo: string }, ahora: Date = new Date()) {
  if (params.motivo.trim().length < 3) throw new ErrorDeNegocio("Indicá el motivo de la cancelación.");
  const [t] = await db
    .update(turnos)
    .set({ estado: "CANCELADO", actualizadoEn: ahora, motivoCancelacion: params.motivo.trim() })
    .where(and(eq(turnos.id, params.turnoId), eq(turnos.estado, "RESERVADO")))
    .returning();
  if (!t) throw new ErrorDeNegocio("Solo se pueden cancelar turnos reservados.");
  return t;
}

/**
 * RF-08 — Indicadores de un rango de fechas:
 * ocupación = minutos reservados / minutos ofrecidos en las franjas (sin domingos ni feriados);
 * ausentismo = ausentes / (atendidos + ausentes).
 */
export async function obtenerIndicadores(db: Db, params: { desde: string; hasta: string }) {
  const [profs, fr, fer, rango, esp] = await Promise.all([
    db.select().from(profesionales).where(eq(profesionales.activo, true)),
    db.select().from(franjas),
    db.select().from(feriados),
    db
      .select({ turno: turnos, especialidadId: servicios.especialidadId })
      .from(turnos)
      .innerJoin(servicios, eq(turnos.servicioId, servicios.id))
      .where(and(gte(turnos.inicio, fechaHora(params.desde, "00:00")), lt(turnos.inicio, fechaHora(sumarDias(params.hasta, 1), "00:00")))),
    db.select().from(especialidades).orderBy(asc(especialidades.orden)),
  ]);
  const cerrados = new Set(fer.map((f) => f.fecha));
  const minutosFranja = (f: { desde: string; hasta: string }) => {
    const [h1, m1] = f.desde.split(":").map(Number);
    const [h2, m2] = f.hasta.split(":").map(Number);
    return h2 * 60 + m2 - (h1 * 60 + m1);
  };

  let ofrecidos = 0;
  const ofrecidosPorEsp = new Map<number, number>();
  for (let f = params.desde; f <= params.hasta; f = sumarDias(f, 1)) {
    if (cerrados.has(f)) continue;
    const dia = new Date(`${f}T12:00:00Z`).getUTCDay() || 7;
    for (const p of profs) {
      const m = fr.filter((x) => x.profesionalId === p.id && x.diaSemana === dia).reduce((a, x) => a + minutosFranja(x), 0);
      ofrecidos += m;
      ofrecidosPorEsp.set(p.especialidadId, (ofrecidosPorEsp.get(p.especialidadId) ?? 0) + m);
    }
  }

  const activos = rango.filter((r) => r.turno.estado !== "CANCELADO");
  const minutos = (r: (typeof rango)[number]) => (r.turno.fin.getTime() - r.turno.inicio.getTime()) / MIN;
  const reservados = activos.reduce((a, r) => a + minutos(r), 0);
  const atendidos = rango.filter((r) => r.turno.estado === "ATENDIDO").length;
  const ausentes = rango.filter((r) => r.turno.estado === "AUSENTE").length;

  return {
    turnos: activos.length,
    cancelados: rango.length - activos.length,
    atendidos,
    ausentes,
    ocupacion: ofrecidos ? reservados / ofrecidos : null,
    ausentismo: atendidos + ausentes ? ausentes / (atendidos + ausentes) : null,
    porEspecialidad: esp.map((e) => {
      const deEsp = activos.filter((r) => r.especialidadId === e.id);
      const min = deEsp.reduce((a, r) => a + minutos(r), 0);
      const ofr = ofrecidosPorEsp.get(e.id) ?? 0;
      return { slug: e.slug, nombre: e.nombre, turnos: deEsp.length, ocupacion: ofr ? min / ofr : null };
    }),
  };
}

export function rangoReservable(ahora: Date) {
  const desde = fechaLocal(ahora);
  return { desde, hasta: sumarDias(desde, HORIZONTE_DIAS) };
}

export { diaReservable };
