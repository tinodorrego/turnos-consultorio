/**
 * Reglas de agenda. Funciones puras: no dependen de framework ni de base de datos.
 * Cada una cita la regla (RN-xx) o requisito (RF-xx) de docs/03-srs.md que implementa.
 *
 * Argentina no usa horario de verano: todas las horas locales son UTC-03:00.
 */
import { z } from "zod";

export const ZONA = "America/Argentina/Buenos_Aires";
const OFFSET = "-03:00";
const MIN = 60 * 1000;
const HORA = 60 * MIN;

/** RN-03 — Anticipación mínima para reservar. */
export const ANTICIPACION_MIN_HORAS = 2;
/** RN-03 — Hasta cuántos días hacia adelante se puede reservar. */
export const HORIZONTE_DIAS = 30;
/** RN-05 — El paciente puede cancelar solo hasta 24 h antes. */
export const CANCELACION_HORAS = 24;
/** RN-02 — Los turnos empiezan en múltiplos de 30 minutos. */
export const GRANULARIDAD_MIN = 30;
/** RN-07 — Máximo de turnos futuros activos por paciente (por email). */
export const MAX_TURNOS_FUTUROS = 2;

export const TIPOS = ["PRIMERA", "CONTROL"] as const;
export type Tipo = (typeof TIPOS)[number];

export const ESTADOS_TURNO = ["RESERVADO", "ATENDIDO", "AUSENTE", "CANCELADO"] as const;
export type EstadoTurno = (typeof ESTADOS_TURNO)[number];

export type Franja = { diaSemana: number; desde: string; hasta: string };
export type Intervalo = { inicio: Date; fin: Date };

/** "2026-12-03" + "09:30" → instante en hora de Argentina. */
export function fechaHora(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00${OFFSET}`);
}

const formatoFecha = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** Instante → "YYYY-MM-DD" en hora de Argentina. */
export function fechaLocal(instante: Date): string {
  return formatoFecha.format(instante);
}

/** 1 = lunes … 7 = domingo. */
export function diaSemana(fecha: string): number {
  const d = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** RN-04 — Dos intervalos se superponen si uno empieza antes de que termine el otro. */
export function seSuperponen(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.getTime() < b.fin.getTime() && b.inicio.getTime() < a.fin.getTime();
}

/** RN-03 / RN-06 — ¿Se puede reservar algo ese día? */
export function diaReservable(fecha: string, ahora: Date, feriados: ReadonlySet<string>): boolean {
  const hoy = fechaLocal(ahora);
  return fecha >= hoy && fecha <= sumarDias(hoy, HORIZONTE_DIAS) && diaSemana(fecha) !== 7 && !feriados.has(fecha);
}

/**
 * RF-01 / RF-02 — Horarios libres de un profesional en un día.
 * Aplica: franjas semanales (RN-02), duración del servicio (RN-01), anticipación y horizonte (RN-03),
 * superposición con turnos tomados (RN-04) y días cerrados (RN-06).
 */
export function generarHorarios(params: {
  fecha: string;
  franjas: readonly Franja[];
  duracionMin: number;
  ocupados: readonly Intervalo[];
  ahora: Date;
  feriados: ReadonlySet<string>;
}): Date[] {
  const { fecha, franjas, duracionMin, ocupados, ahora, feriados } = params;
  if (!diaReservable(fecha, ahora, feriados)) return [];
  const minimo = ahora.getTime() + ANTICIPACION_MIN_HORAS * HORA;
  const dia = diaSemana(fecha);
  const libres: Date[] = [];

  for (const f of franjas.filter((x) => x.diaSemana === dia)) {
    for (let m = minutos(f.desde); m + duracionMin <= minutos(f.hasta); m += GRANULARIDAD_MIN) {
      const inicio = fechaHora(fecha, hhmm(m));
      const fin = new Date(inicio.getTime() + duracionMin * MIN);
      if (inicio.getTime() < minimo) continue;
      if (ocupados.some((o) => seSuperponen({ inicio, fin }, o))) continue;
      libres.push(inicio);
    }
  }
  return libres.sort((a, b) => a.getTime() - b.getTime());
}

/** RN-05 — El paciente puede cancelar solo con 24 h de anticipación. */
export function puedeCancelarPaciente(estado: EstadoTurno, inicio: Date, ahora: Date): boolean {
  return estado === "RESERVADO" && inicio.getTime() - ahora.getTime() >= CANCELACION_HORAS * HORA;
}

/** RN-08 — La asistencia se registra solo sobre turnos reservados que ya empezaron. */
export function puedeRegistrarAsistencia(estado: EstadoTurno, inicio: Date, ahora: Date): boolean {
  return estado === "RESERVADO" && inicio.getTime() <= ahora.getTime();
}

/** Código corto y legible para el comprobante (sin 0/O ni 1/I para no confundir). */
export function generarCodigo(aleatorio: () => number = Math.random): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => letras[Math.floor(aleatorio() * letras.length)]).join("");
}

/** RF-03 — Datos mínimos del paciente (RNF-01: se valida en el servidor). */
export const reservaSchema = z
  .object({
    profesionalId: z.coerce.number().int().positive("Elegí un horario."),
    servicioId: z.coerce.number().int().positive("Elegí el tipo de consulta."),
    inicio: z.iso.datetime({ offset: true, error: "Elegí un horario." }),
    nombre: z.string().trim().min(3, "Escribí tu nombre y apellido.").max(80, "El nombre es demasiado largo."),
    email: z.email("Revisá el email: lo usamos para mandarte el comprobante.").max(120),
    telefono: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s-]{7,19}$/, "Revisá el teléfono: solo números, con código de área."),
    cobertura: z.enum(["PARTICULAR", "OBRA_SOCIAL"], "Indicá si venís por obra social o particular."),
    obraSocial: z.string().trim().max(60).optional(),
  })
  .refine((d) => d.cobertura === "PARTICULAR" || (d.obraSocial && d.obraSocial.length >= 2), {
    path: ["obraSocial"],
    message: "Indicá tu obra social o prepaga.",
  });

export type DatosReserva = z.infer<typeof reservaSchema>;
