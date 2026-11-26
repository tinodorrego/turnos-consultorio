"use server";

import { revalidatePath } from "next/cache";
import { obtenerDb } from "@/db/client";
import { cancelarPorConsultorio, ErrorDeNegocio, registrarAsistencia } from "@/services/turnos";

export type EstadoAccion = { error?: string };

/** RF-07 / RN-08 */
export async function marcarAsistencia(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const turnoId = Number(formData.get("turnoId"));
  const estado = formData.get("estado") === "AUSENTE" ? "AUSENTE" : "ATENDIDO";
  try {
    await registrarAsistencia(await obtenerDb(), { turnoId, estado });
  } catch (e) {
    if (e instanceof ErrorDeNegocio) return { error: e.message };
    throw e;
  }
  revalidatePath("/panel");
  return {};
}

/** RF-07 */
export async function cancelarDesdePanel(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const turnoId = Number(formData.get("turnoId"));
  const motivo = String(formData.get("motivo") ?? "");
  try {
    await cancelarPorConsultorio(await obtenerDb(), { turnoId, motivo });
  } catch (e) {
    if (e instanceof ErrorDeNegocio) return { error: e.message };
    throw e;
  }
  revalidatePath("/panel");
  revalidatePath("/");
  return {};
}
