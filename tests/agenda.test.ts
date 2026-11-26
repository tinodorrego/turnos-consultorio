import { describe, expect, it } from "vitest";
import {
  diaSemana,
  fechaHora,
  generarHorarios,
  puedeCancelarPaciente,
  puedeRegistrarAsistencia,
  reservaSchema,
  seSuperponen,
} from "@/domain/agenda";

// Martes 1 de diciembre de 2026, 7:00 en Buenos Aires.
const ahora = fechaHora("2026-12-01", "07:00");
const sinFeriados = new Set<string>();
const hora = (d: Date) => d.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const lunesManiana = [{ diaSemana: 1, desde: "08:00", hasta: "10:00" }];
const base = { fecha: "2026-12-07", franjas: lunesManiana, duracionMin: 60, ocupados: [], ahora, feriados: sinFeriados };

describe("calendario", () => {
  it("calcula el día de la semana (1 = lunes)", () => {
    expect(diaSemana("2026-12-07")).toBe(1);
    expect(diaSemana("2026-12-06")).toBe(7);
  });
});

describe("RN-01 / RN-02 — horarios según franja y duración", () => {
  it("arma turnos cada 30 minutos que terminan dentro de la franja", () => {
    expect(generarHorarios(base).map(hora)).toEqual(["08:00", "08:30", "09:00"]);
  });
  it("con 30 minutos de duración entra un turno más", () => {
    expect(generarHorarios({ ...base, duracionMin: 30 }).map(hora)).toEqual(["08:00", "08:30", "09:00", "09:30"]);
  });
  it("no ofrece nada en un día sin franja", () => {
    expect(generarHorarios({ ...base, fecha: "2026-12-09" })).toEqual([]);
  });
});

describe("RN-03 — anticipación y horizonte", () => {
  it("no ofrece horarios con menos de 2 horas de anticipación", () => {
    const lunes7 = fechaHora("2026-12-07", "07:00");
    expect(generarHorarios({ ...base, ahora: lunes7 }).map(hora)).toEqual(["09:00"]);
  });
  it("no ofrece días a más de 30 días", () => {
    expect(generarHorarios({ ...base, fecha: "2027-01-04" })).toEqual([]);
  });
  it("no ofrece días pasados", () => {
    expect(generarHorarios({ ...base, fecha: "2026-11-30" })).toEqual([]);
  });
});

describe("RN-04 — sin superposición", () => {
  it("descarta los horarios que pisan un turno tomado", () => {
    const ocupado = { inicio: fechaHora("2026-12-07", "08:30"), fin: fechaHora("2026-12-07", "09:00") };
    expect(generarHorarios({ ...base, ocupados: [ocupado] }).map(hora)).toEqual(["09:00"]);
  });
  it("dos intervalos que solo se tocan no se superponen", () => {
    const a = { inicio: fechaHora("2026-12-07", "08:00"), fin: fechaHora("2026-12-07", "09:00") };
    const b = { inicio: fechaHora("2026-12-07", "09:00"), fin: fechaHora("2026-12-07", "10:00") };
    expect(seSuperponen(a, b)).toBe(false);
  });
});

describe("RN-06 — domingos y feriados", () => {
  it("no ofrece horarios en un feriado", () => {
    const feriados = new Set(["2026-12-08"]);
    const martes = [{ diaSemana: 2, desde: "08:00", hasta: "10:00" }];
    expect(generarHorarios({ ...base, fecha: "2026-12-08", franjas: martes, feriados })).toEqual([]);
  });
  it("no ofrece horarios en domingo aunque haya franja", () => {
    const domingo = [{ diaSemana: 7, desde: "08:00", hasta: "10:00" }];
    expect(generarHorarios({ ...base, fecha: "2026-12-06", franjas: domingo })).toEqual([]);
  });
});

describe("RN-05 — cancelación por el paciente", () => {
  const inicio = fechaHora("2026-12-07", "10:00");
  it("se puede con 24 horas o más", () => {
    expect(puedeCancelarPaciente("RESERVADO", inicio, fechaHora("2026-12-06", "10:00"))).toBe(true);
  });
  it("no se puede con menos de 24 horas", () => {
    expect(puedeCancelarPaciente("RESERVADO", inicio, fechaHora("2026-12-06", "11:00"))).toBe(false);
  });
  it("no se puede si ya estaba cancelado", () => {
    expect(puedeCancelarPaciente("CANCELADO", inicio, fechaHora("2026-12-01", "10:00"))).toBe(false);
  });
});

describe("RN-08 — asistencia", () => {
  const inicio = fechaHora("2026-12-07", "10:00");
  it("se registra desde el horario del turno", () => {
    expect(puedeRegistrarAsistencia("RESERVADO", inicio, fechaHora("2026-12-07", "10:00"))).toBe(true);
    expect(puedeRegistrarAsistencia("RESERVADO", inicio, fechaHora("2026-12-07", "09:59"))).toBe(false);
  });
});

describe("RF-03 — datos del paciente", () => {
  const valido = {
    profesionalId: "1",
    servicioId: "1",
    inicio: "2026-12-07T10:00:00-03:00",
    nombre: "Laura Gómez",
    email: "laura@ejemplo.test",
    telefono: "11 5555-1234",
    cobertura: "PARTICULAR",
  };
  it("acepta datos completos", () => {
    expect(reservaSchema.safeParse(valido).success).toBe(true);
  });
  it("pide la obra social si no es particular", () => {
    const r = reservaSchema.safeParse({ ...valido, cobertura: "OBRA_SOCIAL" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0].path).toEqual(["obraSocial"]);
  });
  it("rechaza un teléfono con letras y un email inválido", () => {
    const r = reservaSchema.safeParse({ ...valido, telefono: "llamame", email: "laura" });
    expect(r.error!.issues.map((i) => i.path[0]).sort()).toEqual(["email", "telefono"]);
  });
});
