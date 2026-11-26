/** RF-04 — Archivo .ics para agregar el turno al calendario del celular. */
import { obtenerDb } from "@/db/client";
import { hashToken, obtenerTurno } from "@/services/turnos";
import { CONSULTORIO, ETIQUETA_TIPO } from "@/lib/formato";

const ics = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapar = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`);

export async function GET(request: Request, ctx: RouteContext<"/turno/[codigo]/calendario">) {
  const { codigo } = await ctx.params;
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const db = await obtenerDb();
  const fila = await obtenerTurno(db, codigo);
  if (!fila || fila.turno.tokenHash !== hashToken(token) || fila.turno.estado === "CANCELADO") {
    return new Response("Turno no encontrado", { status: 404 });
  }
  const t = fila.turno;
  const cuerpo = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Centro Sereno//Turnos//ES",
    "BEGIN:VEVENT",
    `UID:${t.codigo}@centro-sereno.test`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(t.inicio)}`,
    `DTEND:${ics(t.fin)}`,
    `SUMMARY:${escapar(`${fila.especialidad} (${ETIQUETA_TIPO[fila.tipo]}) con ${fila.titulo} ${fila.profesional}`)}`,
    `LOCATION:${escapar(`${CONSULTORIO.nombre}, ${CONSULTORIO.direccion}`)}`,
    `DESCRIPTION:${escapar(`Turno ${t.codigo}. Llegá 10 minutos antes.`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Mañana tenés turno",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(cuerpo, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="turno-${t.codigo}.ics"`,
    },
  });
}
