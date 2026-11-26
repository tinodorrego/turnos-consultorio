/** Modelo físico. Ver docs/05-modelo-datos.md. */
import { boolean, date, index, integer, pgEnum, pgTable, serial, smallint, text, time, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { ESTADOS_TURNO, TIPOS } from "@/domain/agenda";

export const tipoEnum = pgEnum("tipo_consulta", TIPOS);
export const estadoTurnoEnum = pgEnum("estado_turno", ESTADOS_TURNO);
export const coberturaEnum = pgEnum("cobertura", ["PARTICULAR", "OBRA_SOCIAL"]);

export const especialidades = pgTable("especialidades", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  nombre: varchar("nombre", { length: 60 }).notNull(),
  descripcion: text("descripcion").notNull(),
  orden: smallint("orden").notNull(),
});

/** RN-01 — Cada especialidad define la duración de la primera consulta y del control. */
export const servicios = pgTable(
  "servicios",
  {
    id: serial("id").primaryKey(),
    especialidadId: integer("especialidad_id")
      .notNull()
      .references(() => especialidades.id),
    tipo: tipoEnum("tipo").notNull(),
    duracionMin: smallint("duracion_min").notNull(),
  },
  (t) => [uniqueIndex("servicio_unico").on(t.especialidadId, t.tipo)],
);

export const profesionales = pgTable("profesionales", {
  id: serial("id").primaryKey(),
  especialidadId: integer("especialidad_id")
    .notNull()
    .references(() => especialidades.id),
  nombre: varchar("nombre", { length: 80 }).notNull(),
  titulo: varchar("titulo", { length: 20 }).notNull(),
  matricula: varchar("matricula", { length: 20 }).notNull(),
  activo: boolean("activo").notNull().default(true),
});

/** RN-02 — Disponibilidad semanal (1 = lunes … 6 = sábado). */
export const franjas = pgTable("franjas", {
  id: serial("id").primaryKey(),
  profesionalId: integer("profesional_id")
    .notNull()
    .references(() => profesionales.id),
  diaSemana: smallint("dia_semana").notNull(),
  desde: time("desde").notNull(),
  hasta: time("hasta").notNull(),
});

/** RN-06 — Días sin atención. */
export const feriados = pgTable("feriados", {
  fecha: date("fecha", { mode: "string" }).primaryKey(),
  nombre: varchar("nombre", { length: 80 }).notNull(),
});

export const turnos = pgTable(
  "turnos",
  {
    id: serial("id").primaryKey(),
    codigo: varchar("codigo", { length: 6 }).notNull().unique(),
    profesionalId: integer("profesional_id")
      .notNull()
      .references(() => profesionales.id),
    servicioId: integer("servicio_id")
      .notNull()
      .references(() => servicios.id),
    inicio: timestamp("inicio", { withTimezone: true }).notNull(),
    fin: timestamp("fin", { withTimezone: true }).notNull(),
    estado: estadoTurnoEnum("estado").notNull().default("RESERVADO"),
    pacienteNombre: varchar("paciente_nombre", { length: 80 }).notNull(),
    pacienteEmail: varchar("paciente_email", { length: 120 }).notNull(),
    pacienteTelefono: varchar("paciente_telefono", { length: 20 }).notNull(),
    cobertura: coberturaEnum("cobertura").notNull(),
    obraSocial: varchar("obra_social", { length: 60 }),
    /** Hash SHA-256 del token del link de gestión: el token en claro nunca se guarda. */
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true }),
    motivoCancelacion: text("motivo_cancelacion"),
  },
  (t) => [
    index("turnos_profesional_inicio").on(t.profesionalId, t.inicio),
    index("turnos_email").on(t.pacienteEmail),
  ],
);
