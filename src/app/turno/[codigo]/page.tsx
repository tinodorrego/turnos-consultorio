import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { obtenerDb } from "@/db/client";
import { puedeCancelarPaciente, CANCELACION_HORAS } from "@/domain/agenda";
import { hashToken, obtenerTurno } from "@/services/turnos";
import { capitalizar, COLOR_ESP, CONSULTORIO, ETIQUETA_TIPO, formatearDiaLargo, formatearHora } from "@/lib/formato";
import { PieDemo } from "@/components/hoja";
import { BotonCancelar } from "./boton-cancelar";

export const metadata: Metadata = { title: "Tu turno", robots: { index: false } };

export default function Page({ params, searchParams }: PageProps<"/turno/[codigo]">) {
  return (
    <main className="px-3 pt-10 pb-10 sm:pt-16">
      <Suspense fallback={<p className="text-center text-farmacia-claro">Buscando tu turno…</p>}>
        <Comprobante params={params} searchParams={searchParams} />
      </Suspense>
      <PieDemo />
    </main>
  );
}

async function Comprobante({
  params,
  searchParams,
}: {
  params: PageProps<"/turno/[codigo]">["params"];
  searchParams: PageProps<"/turno/[codigo]">["searchParams"];
}) {
  const { codigo } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  const nuevo = sp.nuevo === "1";
  await connection();
  const db = await obtenerDb();
  const fila = await obtenerTurno(db, codigo);

  // Sin el token del link no se muestran datos del paciente (el código solo no alcanza).
  if (!fila || !token || fila.turno.tokenHash !== hashToken(token)) {
    return (
      <div className="mx-auto max-w-md rounded-md bg-hoja p-6 text-center">
        <p className="condensada text-3xl font-black uppercase">No encontramos ese turno</p>
        <p className="mt-2 text-tinta-2">Abrí el link completo del comprobante que te mandamos por email.</p>
        <Link href="/" className="mt-4 inline-block font-bold text-farmacia underline">
          Ir a reservar un turno
        </Link>
      </div>
    );
  }

  const t = fila.turno;
  const ahora = new Date();
  const color = COLOR_ESP[fila.especialidadSlug];
  const cancelable = puedeCancelarPaciente(t.estado, t.inicio, ahora);
  const cancelado = t.estado === "CANCELADO";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6">
      {nuevo && !cancelado ? (
        <p role="status" className="condensada text-center text-4xl leading-none font-black text-white uppercase">
          ¡Listo, tenés turno!
        </p>
      ) : null}

      {/* El cartoncito de turno */}
      <article aria-labelledby="titulo-turno" className="cartoncito relative w-full rounded-sm bg-hoja shadow-[0_16px_32px_-12px_rgba(0,0,0,.6)]">
        <div className={`h-3 rounded-t-sm ${color.fuerte}`} aria-hidden="true" />
        <div className="px-6 pt-5 pb-6">
          <header className="flex items-start justify-between gap-4 border-b-2 border-tinta pb-3">
            <div>
              <p className="condensada text-2xl leading-none font-black uppercase">{CONSULTORIO.nombre}</p>
              <p className="text-xs text-tinta-2">{CONSULTORIO.direccion}</p>
            </div>
            <p className="text-right">
              <span id="titulo-turno" className="block text-xs font-bold tracking-[0.12em] text-tinta-2 uppercase">
                Turno
              </span>
              <span className="tabular text-xl font-black tracking-[0.06em]">{t.codigo}</span>
            </p>
          </header>

          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
            <Dato rotulo="Paciente">{t.pacienteNombre}</Dato>
            <Dato rotulo="Día">{capitalizar(formatearDiaLargo(t.inicio))}</Dato>
            <Dato rotulo="Hora">
              <span className={`condensada text-5xl leading-none font-black ${cancelado ? "text-gris line-through" : ""}`}>{formatearHora(t.inicio)}</span>
            </Dato>
            <Dato rotulo="Con">
              {fila.titulo} {fila.profesional} <span className="text-sm text-tinta-2">({fila.matricula})</span>
            </Dato>
            <Dato rotulo="Consulta">
              {fila.especialidad} · {ETIQUETA_TIPO[fila.tipo]} · {fila.duracionMin}′
            </Dato>
            <Dato rotulo="Cobertura">{t.cobertura === "PARTICULAR" ? "Particular" : t.obraSocial}</Dato>
          </dl>

          <p className="mt-4 border-t border-dashed border-gris pt-3 text-sm text-tinta-2">
            Llegá 10 minutos antes. Si no podés venir, cancelá así el horario le sirve a otra persona.
          </p>
        </div>

        {/* El sello: gesto distintivo */}
        <div
          aria-hidden="true"
          className={`sello pointer-events-none absolute top-32 right-5 grid size-28 place-items-center rounded-full border-4 border-double text-center ${
            cancelado ? "border-rojo text-rojo" : "border-birome text-birome"
          }`}
        >
          <span className="condensada px-2 text-base leading-tight font-black uppercase">
            {cancelado ? "Cancelado" : "Confirmado"}
            <span className="block text-[10px] font-bold tracking-[0.1em]">{CONSULTORIO.nombre}</span>
          </span>
        </div>
        <p className="sr-only">{cancelado ? "Turno cancelado." : "Turno confirmado."}</p>
      </article>

      <div className="flex w-full flex-col gap-3">
        {!cancelado ? (
          <a
            href={`/turno/${t.codigo}/calendario?t=${encodeURIComponent(token)}`}
            className="condensada grid h-14 place-items-center rounded-md bg-amarillo text-xl font-black text-tinta uppercase no-underline hover:bg-[#ffdd6b]"
          >
            Agregar a mi calendario
          </a>
        ) : null}
        {cancelable ? (
          <BotonCancelar codigo={t.codigo} token={token} />
        ) : !cancelado && t.estado === "RESERVADO" ? (
          <p className="rounded-md bg-farmacia-oscuro px-4 py-3 text-sm text-white">
            Falta menos de {CANCELACION_HORAS} h: para cancelar, llamá al {CONSULTORIO.telefono}.
          </p>
        ) : null}
        <Link href="/" className="text-center font-bold text-white underline">
          {cancelado ? "Reservar otro turno" : "Volver al almanaque"}
        </Link>
      </div>
    </div>
  );
}

function Dato({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="pt-1 text-xs font-bold tracking-[0.08em] text-tinta-2 uppercase">{rotulo}</dt>
      <dd className="font-bold">{children}</dd>
    </>
  );
}
