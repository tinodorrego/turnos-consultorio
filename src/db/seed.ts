/** Datos semilla ficticios: el consultorio, sus profesionales y sus horarios no existen. */
import { sql } from "drizzle-orm";
import type { Db } from "./client";
import { especialidades, feriados, franjas, profesionales, servicios } from "./schema";

export const ESPECIALIDADES = [
  { slug: "kinesiologia", nombre: "Kinesiología", descripcion: "Rehabilitación, dolor de espalda y lesiones deportivas.", orden: 1 },
  { slug: "nutricion", nombre: "Nutrición", descripcion: "Plan de alimentación y seguimiento.", orden: 2 },
  { slug: "psicologia", nombre: "Psicología", descripcion: "Terapia individual para adultos.", orden: 3 },
];

/** RN-01 — Duración en minutos por especialidad y tipo. */
const DURACIONES: Record<string, { PRIMERA: number; CONTROL: number }> = {
  kinesiologia: { PRIMERA: 60, CONTROL: 30 },
  nutricion: { PRIMERA: 60, CONTROL: 30 },
  psicologia: { PRIMERA: 60, CONTROL: 50 },
};

const PROFESIONALES: { especialidad: string; nombre: string; titulo: string; matricula: string; franjas: [number, string, string][] }[] = [
  { especialidad: "kinesiologia", nombre: "Martina Ferro", titulo: "Lic.", matricula: "MN 4512", franjas: [[1, "08:00", "13:00"], [3, "08:00", "13:00"], [5, "14:00", "19:00"]] },
  { especialidad: "kinesiologia", nombre: "Tomás Rivas", titulo: "Lic.", matricula: "MN 3871", franjas: [[2, "14:00", "20:00"], [4, "14:00", "20:00"], [6, "09:00", "13:00"]] },
  { especialidad: "nutricion", nombre: "Julieta Campos", titulo: "Lic.", matricula: "MN 2290", franjas: [[1, "15:00", "19:00"], [4, "09:00", "13:00"]] },
  { especialidad: "psicologia", nombre: "Andrés Molina", titulo: "Lic.", matricula: "MN 6634", franjas: [[2, "09:00", "13:00"], [3, "16:00", "20:00"], [5, "09:00", "13:00"]] },
];

/** RN-06 — Feriados nacionales de fecha fija del período de demo. */
const FERIADOS = [
  { fecha: "2026-12-08", nombre: "Inmaculada Concepción de María" },
  { fecha: "2026-12-25", nombre: "Navidad" },
  { fecha: "2027-01-01", nombre: "Año Nuevo" },
];

/** Idempotente: si ya hay especialidades, no hace nada. */
export async function sembrar(db: Db): Promise<void> {
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(especialidades);
  if (total > 0) return;

  const esp = await db.insert(especialidades).values(ESPECIALIDADES).returning();
  const idPorSlug = new Map(esp.map((e) => [e.slug, e.id]));

  await db.insert(servicios).values(
    esp.flatMap((e) => [
      { especialidadId: e.id, tipo: "PRIMERA" as const, duracionMin: DURACIONES[e.slug].PRIMERA },
      { especialidadId: e.id, tipo: "CONTROL" as const, duracionMin: DURACIONES[e.slug].CONTROL },
    ]),
  );

  for (const p of PROFESIONALES) {
    const [creado] = await db
      .insert(profesionales)
      .values({ especialidadId: idPorSlug.get(p.especialidad)!, nombre: p.nombre, titulo: p.titulo, matricula: p.matricula })
      .returning();
    await db.insert(franjas).values(p.franjas.map(([diaSemana, desde, hasta]) => ({ profesionalId: creado.id, diaSemana, desde, hasta })));
  }

  await db.insert(feriados).values(FERIADOS).onConflictDoNothing();
}
