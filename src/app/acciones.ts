"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerDb } from "@/db/client";
import { reservaSchema } from "@/domain/agenda";
import { cancelarPorPaciente, ErrorDeNegocio, reservar } from "@/services/turnos";

export type EstadoReserva = { error?: string; errores?: Partial<Record<string, string>>; valores?: Record<string, string> };

const CAMPOS = ["profesionalId", "servicioId", "inicio", "nombre", "email", "telefono", "cobertura", "obraSocial"];

/** RF-03 / RF-04 — Reserva desde el talón. El servidor vuelve a validar todo (RNF-01). */
export async function reservarTurno(_prev: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const valores = Object.fromEntries(CAMPOS.map((k) => [k, String(formData.get(k) ?? "")]));
  const datos = reservaSchema.safeParse({ ...valores, obraSocial: valores.obraSocial || undefined });
  if (!datos.success) {
    const errores: Record<string, string> = {};
    for (const i of datos.error.issues) errores[String(i.path[0])] ??= i.message;
    return { errores, valores };
  }

  let destino: string;
  try {
    const db = await obtenerDb();
    const { turno, token } = await reservar(db, datos.data);
    destino = `/turno/${turno.codigo}?t=${encodeURIComponent(token)}&nuevo=1`;
  } catch (e) {
    if (e instanceof ErrorDeNegocio) return { error: e.message, valores };
    throw e;
  }
  revalidatePath("/");
  redirect(destino);
}

/** RF-05 / RN-05 */
export async function cancelarTurno(_prev: EstadoReserva, formData: FormData): Promise<EstadoReserva> {
  const codigo = String(formData.get("codigo") ?? "");
  const token = String(formData.get("token") ?? "");
  try {
    const db = await obtenerDb();
    await cancelarPorPaciente(db, { codigo, token });
  } catch (e) {
    if (e instanceof ErrorDeNegocio) return { error: e.message };
    throw e;
  }
  revalidatePath("/");
  revalidatePath(`/turno/${codigo}`);
  return {};
}
