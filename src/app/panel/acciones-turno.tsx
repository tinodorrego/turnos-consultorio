"use client";

import { useActionState, useState } from "react";
import { cancelarDesdePanel, marcarAsistencia, type EstadoAccion } from "./acciones";

export function AccionesTurno({ turnoId, empezo }: { turnoId: number; empezo: boolean }) {
  const [asistencia, marcar, marcando] = useActionState<EstadoAccion, FormData>(marcarAsistencia, {});
  const [cancelacion, cancelar, cancelando] = useActionState<EstadoAccion, FormData>(cancelarDesdePanel, {});
  const [abierto, setAbierto] = useState(false);
  const error = asistencia.error ?? cancelacion.error;

  return (
    <div className="flex flex-col gap-2">
      {empezo ? (
        <form action={marcar} className="grid grid-cols-2 gap-1.5">
          <input type="hidden" name="turnoId" value={turnoId} />
          <button name="estado" value="ATENDIDO" disabled={marcando} className="h-10 rounded-md bg-farmacia text-sm font-bold text-white hover:bg-farmacia-oscuro disabled:opacity-60">
            Vino
          </button>
          <button name="estado" value="AUSENTE" disabled={marcando} className="h-10 rounded-md border-2 border-rojo text-sm font-bold text-rojo hover:bg-rojo hover:text-white disabled:opacity-60">
            No vino
          </button>
        </form>
      ) : abierto ? (
        <form action={cancelar} className="flex flex-col gap-1.5">
          <input type="hidden" name="turnoId" value={turnoId} />
          <label className="text-xs font-bold" htmlFor={`motivo-${turnoId}`}>
            Motivo (se le informa al paciente)
          </label>
          <input id={`motivo-${turnoId}`} name="motivo" required minLength={3} className="h-10 rounded-md border-2 border-regla px-2 text-sm" />
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => setAbierto(false)} className="h-9 rounded-md border-2 border-regla text-sm font-bold">
              Volver
            </button>
            <button disabled={cancelando} className="h-9 rounded-md bg-rojo text-sm font-bold text-white disabled:opacity-60">
              Cancelar turno
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAbierto(true)} className="self-start text-sm font-bold text-tinta-2 underline hover:text-rojo">
          Cancelar…
        </button>
      )}
      {error ? (
        <p role="alert" className="text-xs font-bold text-rojo">
          {error}
        </p>
      ) : null}
    </div>
  );
}
