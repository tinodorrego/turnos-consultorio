CREATE TYPE "public"."cobertura" AS ENUM('PARTICULAR', 'OBRA_SOCIAL');--> statement-breakpoint
CREATE TYPE "public"."estado_turno" AS ENUM('RESERVADO', 'ATENDIDO', 'AUSENTE', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."tipo_consulta" AS ENUM('PRIMERA', 'CONTROL');--> statement-breakpoint
CREATE TABLE "especialidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(40) NOT NULL,
	"nombre" varchar(60) NOT NULL,
	"descripcion" text NOT NULL,
	"orden" smallint NOT NULL,
	CONSTRAINT "especialidades_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "feriados" (
	"fecha" date PRIMARY KEY NOT NULL,
	"nombre" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "franjas" (
	"id" serial PRIMARY KEY NOT NULL,
	"profesional_id" integer NOT NULL,
	"dia_semana" smallint NOT NULL,
	"desde" time NOT NULL,
	"hasta" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profesionales" (
	"id" serial PRIMARY KEY NOT NULL,
	"especialidad_id" integer NOT NULL,
	"nombre" varchar(80) NOT NULL,
	"titulo" varchar(20) NOT NULL,
	"matricula" varchar(20) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicios" (
	"id" serial PRIMARY KEY NOT NULL,
	"especialidad_id" integer NOT NULL,
	"tipo" "tipo_consulta" NOT NULL,
	"duracion_min" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(6) NOT NULL,
	"profesional_id" integer NOT NULL,
	"servicio_id" integer NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone NOT NULL,
	"estado" "estado_turno" DEFAULT 'RESERVADO' NOT NULL,
	"paciente_nombre" varchar(80) NOT NULL,
	"paciente_email" varchar(120) NOT NULL,
	"paciente_telefono" varchar(20) NOT NULL,
	"cobertura" "cobertura" NOT NULL,
	"obra_social" varchar(60),
	"token_hash" varchar(64) NOT NULL,
	"creado_en" timestamp with time zone NOT NULL,
	"actualizado_en" timestamp with time zone,
	"motivo_cancelacion" text,
	CONSTRAINT "turnos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "franjas" ADD CONSTRAINT "franjas_profesional_id_profesionales_id_fk" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profesionales" ADD CONSTRAINT "profesionales_especialidad_id_especialidades_id_fk" FOREIGN KEY ("especialidad_id") REFERENCES "public"."especialidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_especialidad_id_especialidades_id_fk" FOREIGN KEY ("especialidad_id") REFERENCES "public"."especialidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_profesional_id_profesionales_id_fk" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_servicio_id_servicios_id_fk" FOREIGN KEY ("servicio_id") REFERENCES "public"."servicios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "servicio_unico" ON "servicios" USING btree ("especialidad_id","tipo");--> statement-breakpoint
CREATE INDEX "turnos_profesional_inicio" ON "turnos" USING btree ("profesional_id","inicio");--> statement-breakpoint
CREATE INDEX "turnos_email" ON "turnos" USING btree ("paciente_email");