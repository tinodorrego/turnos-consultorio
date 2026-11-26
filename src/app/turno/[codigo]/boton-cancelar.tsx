"use client";

import { useActionState, useState } from "react";
import { cancelarTurno, type EstadoReserva } from "@/app/acciones";

/** RF-05 — Cancelar pide una confirmación en el mismo lugar, sin modal. */
export function BotonCancelar({ codigo, token }: { codigo: string; token: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, enviar, enviando] = useActionState<EstadoReserva, FormData>(cancelarTurno, {});

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="h-12 rounded-md border-2 border-white/70 font-bold text-white hover:border-white hover:bg-white/10"
      >
        Cancelar el turno
      </button>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-3 rounded-md bg-white p-4">
      <input type="hidden" name="codigo" value={codigo} />
      <input type="hidden" name="token" value={token} />
      <p className="font-bold">¿Seguro? El horario queda libre para otra persona.</p>
      {estado.error ? (
        <p role="alert" className="text-sm font-bold text-rojo">
          {estado.error}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setConfirmando(false)} className="h-12 rounded-md border-2 border-tinta font-bold">
          No, lo mantengo
        </button>
        <button type="submit" disabled={enviando} className="h-12 rounded-md bg-rojo font-bold text-white disabled:opacity-70">
          {enviando ? "Cancelando…" : "Sí, cancelar"}
        </button>
      </div>
    </form>
  );
}
