"use client";

import { useActionState, useState } from "react";
import { reservarTurno, type EstadoReserva } from "./acciones";

type Resumen = { especialidad: string; tipo: string; duracion: number; profesional: string; dia: string; hora: string };

const campo =
  "h-12 w-full rounded-md border-2 border-regla bg-white px-3 text-lg text-tinta placeholder:text-tinta-2 hover:border-tinta-2 focus:border-birome aria-invalid:border-rojo";

/** RF-03 — Paso 4: datos mínimos y confirmación. */
export function FormReserva(props: {
  resumen: Resumen;
  profesionalId: number;
  servicioId: number;
  inicio: string;
  colorFondo: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoReserva, FormData>(reservarTurno, {});
  const v = estado.valores ?? {};
  const [cobertura, setCobertura] = useState(v.cobertura || "PARTICULAR");
  const err = estado.errores ?? {};
  const r = props.resumen;

  return (
    <form action={enviar} noValidate className="flex flex-col gap-4 rounded-md bg-[#f4f5f6] p-5">
      <input type="hidden" name="profesionalId" value={props.profesionalId} />
      <input type="hidden" name="servicioId" value={props.servicioId} />
      <input type="hidden" name="inicio" value={props.inicio} />

      <div className={`rounded-md p-4 text-white ${props.colorFondo}`}>
        <p className="text-sm font-bold text-white/90">Vas a reservar</p>
        <p className="condensada text-4xl leading-none font-black">{r.hora} h</p>
        <p className="mt-1 font-bold">{r.dia}</p>
        <p className="text-sm text-white/90">
          {r.especialidad} · {r.tipo} ({r.duracion}′) con {r.profesional}
        </p>
      </div>

      <p className="text-sm font-bold">4 · Tus datos</p>

      {estado.error ? (
        <p role="alert" className="rounded-md border-2 border-rojo bg-white px-3 py-2 text-sm font-bold text-rojo">
          {estado.error}
        </p>
      ) : null}

      <Campo id="nombre" etiqueta="Nombre y apellido" error={err.nombre}>
        <input id="nombre" name="nombre" autoComplete="name" defaultValue={v.nombre} required aria-invalid={err.nombre ? true : undefined} aria-describedby="nombre-error" className={campo} />
      </Campo>
      <Campo id="telefono" etiqueta="Teléfono (WhatsApp)" error={err.telefono}>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="11 5555-1234"
          defaultValue={v.telefono}
          required
          aria-invalid={err.telefono ? true : undefined}
          aria-describedby="telefono-error"
          className={campo}
        />
      </Campo>
      <Campo id="email" etiqueta="Email (te mandamos el comprobante)" error={err.email}>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={v.email}
          required
          aria-invalid={err.email ? true : undefined}
          aria-describedby="email-error"
          className={campo}
        />
      </Campo>

      <fieldset>
        <legend className="mb-1.5 font-bold">¿Cómo venís?</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { valor: "PARTICULAR", texto: "Particular" },
            { valor: "OBRA_SOCIAL", texto: "Obra social / prepaga" },
          ].map((o) => (
            <label
              key={o.valor}
              className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border-2 border-regla bg-white px-3 font-bold has-checked:border-tinta has-checked:bg-tinta has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-birome"
            >
              <input
                type="radio"
                name="cobertura"
                value={o.valor}
                checked={cobertura === o.valor}
                onChange={() => setCobertura(o.valor)}
                className="sr-only"
              />
              {o.texto}
            </label>
          ))}
        </div>
      </fieldset>

      {cobertura === "OBRA_SOCIAL" ? (
        <Campo id="obraSocial" etiqueta="¿Cuál?" error={err.obraSocial}>
          <input
            id="obraSocial"
            name="obraSocial"
            defaultValue={v.obraSocial}
            placeholder="Ej.: OSDE, Swiss Medical, IOMA"
            aria-invalid={err.obraSocial ? true : undefined}
            aria-describedby="obraSocial-error"
            className={campo}
          />
        </Campo>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="condensada mt-1 h-14 rounded-md bg-farmacia text-2xl font-black text-white uppercase shadow-[0_6px_14px_-6px_rgba(6,72,51,.7)] transition-[transform,background-color] hover:bg-farmacia-oscuro active:translate-y-px disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? "Reservando…" : "Confirmar turno"}
      </button>
      <p className="text-xs text-tinta-2">Podés cancelarlo vos mismo desde el comprobante hasta 24 h antes.</p>
    </form>
  );
}

function Campo({ id, etiqueta, error, children }: { id: string; etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-bold">
        {etiqueta}
      </label>
      {children}
      <p id={`${id}-error`} className="text-sm font-bold text-rojo empty:hidden">
        {error}
      </p>
    </div>
  );
}
