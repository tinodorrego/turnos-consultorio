import { beforeEach, describe, expect, it } from "vitest";
import { crearDbEnMemoria, type Db } from "@/db/client";
import { fechaHora } from "@/domain/agenda";
import {
  agendaDelDia,
  cancelarPorConsultorio,
  cancelarPorPaciente,
  disponibilidadPorDia,
  horariosDelDia,
  obtenerCatalogo,
  obtenerIndicadores,
  registrarAsistencia,
  reservar,
} from "@/services/turnos";

// Martes 1/12/2026 7:00. Martina Ferro (kinesiología) atiende lunes y miércoles 8–13 y viernes 14–19.
const ahora = fechaHora("2026-12-01", "07:00");
let db: Db;
let kine: { id: number; primera: number; control: number; martina: number; tomas: number };
let nutri: { id: number; julieta: number };

beforeEach(async () => {
  db = await crearDbEnMemoria();
  const cat = await obtenerCatalogo(db);
  const k = cat.find((e) => e.slug === "kinesiologia")!;
  const n = cat.find((e) => e.slug === "nutricion")!;
  kine = {
    id: k.id,
    primera: k.servicios.find((s) => s.tipo === "PRIMERA")!.id,
    control: k.servicios.find((s) => s.tipo === "CONTROL")!.id,
    martina: k.profesionales.find((p) => p.nombre === "Martina Ferro")!.id,
    tomas: k.profesionales.find((p) => p.nombre === "Tomás Rivas")!.id,
  };
  nutri = { id: n.id, julieta: n.profesionales[0].id };
});

const datos = (extra: Partial<Parameters<typeof reservar>[1]> = {}) => ({
  profesionalId: kine.martina,
  servicioId: kine.primera,
  inicio: "2026-12-07T08:00:00-03:00",
  nombre: "Laura Gómez",
  email: "laura@ejemplo.test",
  telefono: "11 5555-1234",
  cobertura: "PARTICULAR" as const,
  ...extra,
});

describe("RF-01 — disponibilidad del almanaque", () => {
  it("marca días con lugar y deja en cero domingos y feriados", async () => {
    const { disponibilidad } = await disponibilidadPorDia(db, { especialidadId: kine.id, tipo: "PRIMERA", desde: "2026-12-05", hasta: "2026-12-08", ahora });
    expect(disponibilidad["2026-12-05"]).toBeGreaterThan(0); // sábado: Tomás 9–13
    expect(disponibilidad["2026-12-06"]).toBe(0); // domingo
    expect(disponibilidad["2026-12-07"]).toBeGreaterThan(0); // lunes: Martina 8–13
    expect(disponibilidad["2026-12-08"]).toBe(0); // feriado
  });
});

describe("RF-02 — horarios del día por profesional", () => {
  it("agrupa por profesional y solo muestra a quien atiende ese día", async () => {
    const { profesionales } = await horariosDelDia(db, { especialidadId: kine.id, tipo: "PRIMERA", fecha: "2026-12-07", ahora });
    const martina = profesionales.find((p) => p.profesional.id === kine.martina)!;
    const tomas = profesionales.find((p) => p.profesional.id === kine.tomas)!;
    expect(martina.horarios).toHaveLength(9); // 8:00 a 12:00 cada 30'
    expect(tomas.horarios).toHaveLength(0);
  });
});

describe("RF-03 / RF-04 / RN-04 — reserva", () => {
  it("reserva, devuelve código y token, y el horario deja de estar libre", async () => {
    const { turno, token } = await reservar(db, datos(), ahora);
    expect(turno.codigo).toMatch(/^[A-Z2-9]{6}$/);
    expect(token.length).toBeGreaterThan(20);
    expect(turno.tokenHash).not.toBe(token);

    const { profesionales } = await horariosDelDia(db, { especialidadId: kine.id, tipo: "CONTROL", fecha: "2026-12-07", ahora });
    const libres = profesionales.find((p) => p.profesional.id === kine.martina)!.horarios.map((h) => h.toISOString());
    expect(libres).not.toContain(fechaHora("2026-12-07", "08:00").toISOString());
    expect(libres).not.toContain(fechaHora("2026-12-07", "08:30").toISOString()); // la primera consulta dura 60'
  });

  it("no permite tomar un horario superpuesto", async () => {
    await reservar(db, datos(), ahora);
    await expect(
      reservar(db, datos({ servicioId: kine.control, inicio: "2026-12-07T08:30:00-03:00", email: "otro@ejemplo.test" }), ahora),
    ).rejects.toThrow("ya no está disponible");
  });

  it("si dos personas reservan el mismo horario a la vez, solo una lo consigue", async () => {
    const resultados = await Promise.allSettled([
      reservar(db, datos({ email: "a@ejemplo.test" }), ahora),
      reservar(db, datos({ email: "b@ejemplo.test" }), ahora),
    ]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("rechaza un horario fuera de la franja del profesional", async () => {
    await expect(reservar(db, datos({ inicio: "2026-12-07T15:00:00-03:00" }), ahora)).rejects.toThrow("no está disponible");
  });

  it("rechaza un servicio de otra especialidad", async () => {
    await expect(reservar(db, datos({ profesionalId: nutri.julieta }), ahora)).rejects.toThrow("no atiende");
  });

  it("RN-07 — limita los turnos pendientes por paciente", async () => {
    await reservar(db, datos(), ahora);
    await reservar(db, datos({ inicio: "2026-12-07T10:00:00-03:00" }), ahora);
    await expect(reservar(db, datos({ inicio: "2026-12-09T08:00:00-03:00" }), ahora)).rejects.toThrow("2 turnos pendientes");
  });
});

describe("RF-05 / RN-05 — cancelación por el paciente", () => {
  it("cancela con el link válido y libera el horario", async () => {
    const { turno, token } = await reservar(db, datos(), ahora);
    await cancelarPorPaciente(db, { codigo: turno.codigo, token }, ahora);
    const otra = await reservar(db, datos({ email: "otra@ejemplo.test" }), ahora);
    expect(otra.turno.inicio.getTime()).toBe(turno.inicio.getTime());
  });

  it("rechaza un token inválido", async () => {
    const { turno } = await reservar(db, datos(), ahora);
    await expect(cancelarPorPaciente(db, { codigo: turno.codigo, token: "cualquiera" }, ahora)).rejects.toThrow("link");
  });

  it("no deja cancelar con menos de 24 horas", async () => {
    const { turno, token } = await reservar(db, datos(), ahora);
    await expect(cancelarPorPaciente(db, { codigo: turno.codigo, token }, fechaHora("2026-12-06", "09:00"))).rejects.toThrow("24 h");
  });
});

describe("RF-06 / RF-07 / RN-08 — panel del consultorio", () => {
  it("muestra la agenda del día y registra asistencia solo desde el horario", async () => {
    const { turno } = await reservar(db, datos(), ahora);
    const agenda = await agendaDelDia(db, "2026-12-07");
    expect(agenda.find((p) => p.id === kine.martina)!.turnos).toHaveLength(1);

    await expect(registrarAsistencia(db, { turnoId: turno.id, estado: "ATENDIDO" }, ahora)).rejects.toThrow("Todavía no empezó");
    const marcado = await registrarAsistencia(db, { turnoId: turno.id, estado: "AUSENTE" }, fechaHora("2026-12-07", "08:20"));
    expect(marcado.estado).toBe("AUSENTE");
  });

  it("el consultorio cancela con motivo", async () => {
    const { turno } = await reservar(db, datos(), ahora);
    await expect(cancelarPorConsultorio(db, { turnoId: turno.id, motivo: "" }, ahora)).rejects.toThrow("motivo");
    const c = await cancelarPorConsultorio(db, { turnoId: turno.id, motivo: "La profesional está enferma" }, ahora);
    expect(c.estado).toBe("CANCELADO");
  });
});

describe("RF-08 — indicadores", () => {
  it("calcula ocupación y ausentismo", async () => {
    const a = await reservar(db, datos(), ahora);
    const b = await reservar(db, datos({ inicio: "2026-12-07T10:00:00-03:00", email: "b@ejemplo.test" }), ahora);
    const despues = fechaHora("2026-12-07", "12:00");
    await registrarAsistencia(db, { turnoId: a.turno.id, estado: "ATENDIDO" }, despues);
    await registrarAsistencia(db, { turnoId: b.turno.id, estado: "AUSENTE" }, despues);

    const ind = await obtenerIndicadores(db, { desde: "2026-12-07", hasta: "2026-12-07" });
    expect(ind.turnos).toBe(2);
    expect(ind.ausentismo).toBe(0.5);
    // Lunes: Martina 8–13 (300') + Julieta 15–19 (240') = 540' ofrecidos; 120' reservados.
    expect(ind.ocupacion).toBeCloseTo(120 / 540);
  });
});
