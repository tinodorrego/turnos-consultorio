import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { obtenerDb } from "@/db/client";
import { diaSemana, fechaLocal, sumarDias, type EstadoTurno } from "@/domain/agenda";
import { agendaDelDia, obtenerIndicadores } from "@/services/turnos";
import { capitalizar, COLOR_ESP, ETIQUETA_TIPO, fechaAMediodia, formatearDiaLargo, formatearHora, iniciales } from "@/lib/formato";
import { BandaConsultorio, Hoja } from "@/components/hoja";
import { AccionesTurno } from "./acciones-turno";

export const metadata: Metadata = { title: "Panel del consultorio", robots: { index: false } };

const ESTADO: Record<EstadoTurno, { texto: string; clase: string }> = {
  RESERVADO: { texto: "Reservado", clase: "border-tinta text-tinta" },
  ATENDIDO: { texto: "Vino", clase: "border-farmacia bg-farmacia text-white" },
  AUSENTE: { texto: "No vino", clase: "border-rojo bg-rojo text-white" },
  CANCELADO: { texto: "Cancelado", clase: "border-regla text-tinta-2 line-through" },
};

export default function Page({ searchParams }: PageProps<"/panel">) {
  return (
    <main className="px-3 pt-8 pb-10 sm:px-6">
      <Hoja>
        <BandaConsultorio />
        <Suspense fallback={<p className="p-8 text-tinta-2">Cargando agenda…</p>}>
          <Panel searchParams={searchParams} />
        </Suspense>
      </Hoja>
      <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-farmacia-claro">
        Panel de demostración sin inicio de sesión (pendiente, RNF-03). Datos ficticios.
      </p>
    </main>
  );
}

async function Panel({ searchParams }: { searchParams: PageProps<"/panel">["searchParams"] }) {
  const sp = await searchParams;
  await connection();
  const ahora = new Date();
  const hoy = fechaLocal(ahora);
  const fecha = typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : hoy;
  const db = await obtenerDb();

  // Semana de la fecha elegida: lunes a sábado.
  const lunes = sumarDias(fecha, 1 - diaSemana(fecha));
  const [agenda, semana] = await Promise.all([agendaDelDia(db, fecha), obtenerIndicadores(db, { desde: lunes, hasta: sumarDias(lunes, 5) })]);
  const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);

  return (
    <div className="px-5 pt-7 pb-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-tinta-2">Panel del consultorio</p>
          <h1 className="condensada text-5xl leading-none font-black uppercase">{capitalizar(formatearDiaLargo(fechaAMediodia(fecha)))}</h1>
        </div>
        <nav aria-label="Cambiar de día" className="flex gap-2">
          <Link href={`/panel?fecha=${sumarDias(fecha, -1)}`} aria-label="Día anterior" className="grid size-12 place-items-center rounded-md border-2 border-tinta text-2xl font-black no-underline hover:bg-tinta hover:text-white">
            ←
          </Link>
          <Link href="/panel" className={`grid h-12 place-items-center rounded-md border-2 px-4 font-bold no-underline ${fecha === hoy ? "border-tinta bg-tinta text-white" : "border-tinta hover:bg-tinta hover:text-white"}`}>
            Hoy
          </Link>
          <Link href={`/panel?fecha=${sumarDias(fecha, 1)}`} aria-label="Día siguiente" className="grid size-12 place-items-center rounded-md border-2 border-tinta text-2xl font-black no-underline hover:bg-tinta hover:text-white">
            →
          </Link>
        </nav>
      </div>

      <section aria-labelledby="titulo-semana" className="mt-6 rounded-md bg-[#f4f5f6] p-4">
        <h2 id="titulo-semana" className="text-sm font-bold text-tinta-2">
          Semana del {formatearDiaLargo(fechaAMediodia(lunes))} (RF-08)
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Indicador rotulo="Ocupación" valor={pct(semana.ocupacion)} ayuda="Minutos reservados sobre minutos ofrecidos" />
          <Indicador rotulo="Ausentismo" valor={pct(semana.ausentismo)} ayuda={`${semana.ausentes} de ${semana.atendidos + semana.ausentes} turnos ya pasados`} />
          <Indicador rotulo="Turnos" valor={String(semana.turnos)} ayuda="Reservados, atendidos o ausentes" />
          <Indicador rotulo="Cancelados" valor={String(semana.cancelados)} ayuda="Por el paciente o el consultorio" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {semana.porEspecialidad.map((e) => (
            <div key={e.slug} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="font-bold">{e.nombre}</span>
              <span className="h-3 overflow-hidden rounded-full bg-white" role="img" aria-label={`Ocupación ${pct(e.ocupacion)}`}>
                <span className={`block h-full rounded-full ${COLOR_ESP[e.slug].fuerte}`} style={{ width: `${Math.min(100, Math.round((e.ocupacion ?? 0) * 100))}%` }} />
              </span>
              <span className="tabular text-right font-bold">{pct(e.ocupacion)}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Agenda del día" className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {agenda.map((p) => {
          const color = COLOR_ESP[p.slug];
          return (
            <div key={p.id} className="flex flex-col">
              <div className={`flex items-center gap-3 rounded-t-md px-3 py-3 text-white ${color.fuerte}`}>
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-white/20 font-black">
                  {iniciales(p.nombre)}
                </span>
                <p className="leading-tight">
                  <span className="font-bold">
                    {p.titulo} {p.nombre}
                  </span>
                  <span className="block text-sm text-white/90">{p.especialidad}</span>
                </p>
              </div>
              <ol className="flex flex-1 flex-col divide-y divide-regla rounded-b-md border-2 border-t-0 border-regla">
                {p.turnos.length === 0 ? (
                  <li className="p-4 text-sm text-tinta-2">Sin turnos este día.</li>
                ) : (
                  p.turnos.map(({ turno: t, tipo }) => (
                    <li key={t.id} className={`flex flex-col gap-2 p-3 ${t.estado === "CANCELADO" ? "bg-[#f8f8f9]" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`condensada text-3xl leading-none font-black ${t.estado === "CANCELADO" ? "text-gris" : ""}`}>{formatearHora(t.inicio)}</span>
                        <span className={`rounded border-2 px-1.5 py-0.5 text-xs font-bold ${ESTADO[t.estado].clase}`}>{ESTADO[t.estado].texto}</span>
                      </div>
                      <p className="leading-tight">
                        <span className="font-bold">{t.pacienteNombre}</span>
                        <span className="block text-sm text-tinta-2">
                          {ETIQUETA_TIPO[tipo]} · {t.cobertura === "PARTICULAR" ? "Particular" : t.obraSocial} · {t.pacienteTelefono}
                        </span>
                        {t.motivoCancelacion ? <span className="block text-sm text-tinta-2">Motivo: {t.motivoCancelacion}</span> : null}
                      </p>
                      {t.estado === "RESERVADO" ? <AccionesTurno turnoId={t.id} empezo={t.inicio.getTime() <= ahora.getTime()} /> : null}
                    </li>
                  ))
                )}
              </ol>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Indicador({ rotulo, valor, ayuda }: { rotulo: string; valor: string; ayuda: string }) {
  return (
    <div>
      <p className="text-sm text-tinta-2">{rotulo}</p>
      <p className="condensada text-4xl leading-none font-black">{valor}</p>
      <p className="mt-1 text-xs text-tinta-2">{ayuda}</p>
    </div>
  );
}
