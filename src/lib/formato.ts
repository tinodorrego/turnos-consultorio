import { ZONA, type Tipo } from "@/domain/agenda";

export const CONSULTORIO = {
  nombre: "Centro Sereno",
  rubros: "Kinesiología · Nutrición · Psicología",
  direccion: "Av. de Ejemplo 1450, 2.º B · CABA",
  telefono: "(011) 0000-0000",
  horario: "Lunes a sábado",
} as const;

/** Color por especialidad: clase de fondo fuerte, fondo claro y texto. */
export const COLOR_ESP: Record<string, { fuerte: string; claro: string; texto: string; borde: string; hoverBorde: string; hex: string }> = {
  kinesiologia: { fuerte: "bg-kine", claro: "bg-kine-claro", texto: "text-kine", borde: "border-kine", hoverBorde: "hover:border-kine", hex: "#b84a08" },
  nutricion: { fuerte: "bg-nutri", claro: "bg-nutri-claro", texto: "text-nutri", borde: "border-nutri", hoverBorde: "hover:border-nutri", hex: "#0b7d87" },
  psicologia: { fuerte: "bg-psico", claro: "bg-psico-claro", texto: "text-psico", borde: "border-psico", hoverBorde: "hover:border-psico", hex: "#6440d0" },
};

export const ETIQUETA_TIPO: Record<Tipo, string> = { PRIMERA: "Primera consulta", CONTROL: "Control" };

const hora = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const diaLargo = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long" });
const diaCorto = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, weekday: "short", day: "numeric", month: "numeric" });

export const formatearHora = (d: Date) => hora.format(d);
export const formatearDiaLargo = (d: Date) => diaLargo.format(d);
export const formatearDiaCorto = (d: Date) => diaCorto.format(d);

/** "2026-12-03" → Date al mediodía de ese día (para formatear sin corrimientos). */
export const fechaAMediodia = (fecha: string) => new Date(`${fecha}T12:00:00-03:00`);

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}
