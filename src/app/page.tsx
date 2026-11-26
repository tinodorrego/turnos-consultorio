import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { obtenerDb } from "@/db/client";
import { fechaLocal, sumarDias, TIPOS, type Tipo } from "@/domain/agenda";
import { disponibilidadPorDia, horariosDelDia, obtenerCatalogo, rangoReservable } from "@/services/turnos";
import {
  capitalizar,
  COLOR_ESP,
  ETIQUETA_TIPO,
  fechaAMediodia,
  formatearDiaLargo,
  formatearHora,
  iniciales,
  MESES,
} from "@/lib/formato";
import { BandaConsultorio, Hoja, PieDemo } from "@/components/hoja";
import { FormReserva } from "./form-reserva";

type Params = Awaited<PageProps<"/">["searchParams"]>;
type Estado = { esp: string; tipo: Tipo; mes: string; dia?: string; p?: number; h?: string };

function href(e: Estado, cambios: Partial<Estado>) {
  const n = { ...e, ...cambios };
  const q = new URLSearchParams({ esp: n.esp, tipo: n.tipo, mes: n.mes });
  if (n.dia) q.set("dia", n.dia);
  if (n.p && n.h) {
    q.set("p", String(n.p));
    q.set("h", n.h);
  }
  return `/?${q.toString()}#${n.dia ? "talon" : "almanaque"}`;
}

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <main className="px-3 pt-8 pb-10 sm:px-6 sm:pt-12">
      <Hoja>
        <BandaConsultorio />
        <Suspense fallback={<p className="p-8 text-tinta-2">Cargando turnos libres…</p>}>
          <Reserva searchParams={searchParams} />
        </Suspense>
      </Hoja>
      <PieDemo />
    </main>
  );
}

async function Reserva({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params: Params = await searchParams;
  await connection();
  const ahora = new Date();
  const db = await obtenerDb();
  const catalogo = await obtenerCatalogo(db);
  const rango = rangoReservable(ahora);

  const esp = catalogo.find((c) => c.slug === params.esp) ?? catalogo[0];
  const tipo: Tipo = (TIPOS as readonly string[]).includes(String(params.tipo)) ? (params.tipo as Tipo) : "PRIMERA";
  const mesMin = rango.desde.slice(0, 7);
  const mesMax = rango.hasta.slice(0, 7);
  const mesPedido = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : mesMin;
  const mes = mesPedido < mesMin ? mesMin : mesPedido > mesMax ? mesMax : mesPedido;
  const dia = typeof params.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.dia) ? params.dia : undefined;
  const p = params.p ? Number(params.p) : undefined;
  const h = typeof params.h === "string" ? params.h : undefined;
  const estado: Estado = { esp: esp.slug, tipo, mes, dia, p, h };

  const primero = `${mes}-01`;
  const ultimo = sumarDias(`${sumarMes(mes, 1)}-01`, -1);
  const desde = primero < rango.desde ? rango.desde : primero;
  const hasta = ultimo > rango.hasta ? rango.hasta : ultimo;
  const { disponibilidad, feriados, servicio } = await disponibilidadPorDia(db, { especialidadId: esp.id, tipo, desde, hasta, ahora });
  const color = COLOR_ESP[esp.slug];
  const hoy = fechaLocal(ahora);

  const delDia = dia ? await horariosDelDia(db, { especialidadId: esp.id, tipo, fecha: dia, ahora }) : null;
  const elegido =
    delDia && p && h
      ? delDia.profesionales.find((x) => x.profesional.id === p && x.horarios.some((d) => d.toISOString() === h))
      : undefined;

  const paso = elegido ? 4 : dia ? 3 : 2;

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-8 px-5 pt-7 pb-8 sm:px-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Lámina: qué pedís */}
        <section aria-labelledby="titulo-reserva" className="flex flex-col gap-6">
          <div>
            <h1 id="titulo-reserva" className="condensada text-5xl leading-[0.92] font-black tracking-[-0.02em] text-balance sm:text-6xl">
              Turnos libres, <span className={color.texto}>a la vista.</span>
            </h1>
            <p className="mt-3 max-w-[38ch] text-base text-tinta-2">
              Elegí la especialidad, tocá un día marcado y reservá en menos de un minuto. Sin llamar, sin esperar respuesta.
            </p>
          </div>

          <Pasos actual={paso} />

          <fieldset>
            <legend className="mb-2 text-sm font-bold">1 · ¿Qué necesitás?</legend>
            <div className="flex flex-col gap-2">
              {catalogo.map((c) => {
                const activo = c.id === esp.id;
                const col = COLOR_ESP[c.slug];
                return (
                  <Link
                    key={c.id}
                    scroll={false}
                    href={href(estado, { esp: c.slug, dia: undefined, p: undefined, h: undefined })}
                    aria-current={activo ? "true" : undefined}
                    className={`group flex items-center gap-3 rounded-md border-2 px-4 py-3 no-underline transition-colors ${
                      activo ? `${col.fuerte} border-transparent text-white` : `border-regla bg-hoja text-tinta ${col.hoverBorde}`
                    }`}
                  >
                    <span aria-hidden="true" className={`size-3.5 shrink-0 rounded-full ${activo ? "bg-white" : col.fuerte}`} />
                    <span className="flex flex-col">
                      <span className="condensada text-2xl leading-none font-extrabold uppercase">{c.nombre}</span>
                      <span className={`text-sm ${activo ? "text-white/90" : "text-tinta-2"}`}>{c.descripcion}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-bold">¿Es tu primera vez con este profesional?</legend>
            <div className="grid grid-cols-2 gap-2">
              {catalogo
                .find((c) => c.id === esp.id)!
                .servicios.sort((a, b) => TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo))
                .map((s) => {
                  const activo = s.tipo === tipo;
                  return (
                    <Link
                      key={s.id}
                      scroll={false}
                      href={href(estado, { tipo: s.tipo, dia, p: undefined, h: undefined })}
                      aria-current={activo ? "true" : undefined}
                      className={`flex flex-col rounded-md border-2 px-3 py-2.5 no-underline ${
                        activo ? "border-tinta bg-tinta text-white" : "border-regla text-tinta hover:border-tinta-2"
                      }`}
                    >
                      <span className="font-bold">{s.tipo === "PRIMERA" ? "Sí, primera consulta" : "No, es un control"}</span>
                      <span className={`text-sm ${activo ? "text-white/80" : "text-tinta-2"}`}>{s.duracionMin} minutos</span>
                    </Link>
                  );
                })}
            </div>
          </fieldset>
        </section>

        {/* El almanaque */}
        <section id="almanaque" aria-labelledby="titulo-mes" className="min-w-0 scroll-mt-4">
          <Almanaque
            estado={estado}
            mes={mes}
            hoy={hoy}
            disponibilidad={disponibilidad}
            feriados={feriados}
            previo={mes > mesMin ? sumarMes(mes, -1) : undefined}
            siguiente={mes < mesMax ? sumarMes(mes, 1) : undefined}
            colorFuerte={color.fuerte}
            colorTexto={color.texto}
          />
        </section>
      </div>

      {/* El talón troquelado: horarios y datos */}
      <section id="talon" aria-label="Horarios del día elegido" className="troquel scroll-mt-4 bg-hoja px-5 pt-8 pb-8 sm:px-8">
        {!dia || !delDia ? (
          <p className="flex items-center gap-3 text-lg text-tinta-2">
            <span aria-hidden="true" className={`inline-block size-3 rounded-full ${color.fuerte}`} />
            Tocá un día marcado del almanaque para ver los horarios.
          </p>
        ) : (
          <div key={`${dia}-${esp.slug}-${tipo}`} className="talon-entra grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <div>
              <h2 className="condensada text-4xl leading-none font-black uppercase sm:text-5xl">
                {capitalizar(formatearDiaLargo(fechaAMediodia(dia)))}
              </h2>
              <p className="mt-2 text-tinta-2">
                {esp.nombre} · {ETIQUETA_TIPO[tipo]} · {servicio.duracionMin} minutos
              </p>
              <p className="mt-4 mb-2 text-sm font-bold">3 · Elegí el horario</p>
              <Horarios estado={estado} delDia={delDia} color={color} disponibilidad={disponibilidad} dia={dia} />
            </div>

            <div aria-live="polite">
              {elegido && h ? (
                <FormReserva
                  key={h}
                  resumen={{
                    especialidad: esp.nombre,
                    tipo: ETIQUETA_TIPO[tipo],
                    duracion: servicio.duracionMin,
                    profesional: `${elegido.profesional.titulo} ${elegido.profesional.nombre}`,
                    dia: capitalizar(formatearDiaLargo(new Date(h))),
                    hora: formatearHora(new Date(h)),
                  }}
                  profesionalId={elegido.profesional.id}
                  servicioId={servicio.id}
                  inicio={h}
                  colorFondo={color.fuerte}
                />
              ) : (
                <div className="rounded-md border-2 border-dashed border-regla p-5 text-tinta-2">
                  <p className="font-bold text-tinta">4 · Tus datos</p>
                  <p className="mt-1 text-sm">Cuando elijas un horario te pedimos nombre, teléfono y email. Nada más.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function sumarMes(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

function Pasos({ actual }: { actual: number }) {
  const pasos = ["Especialidad", "Día", "Horario", "Tus datos"];
  return (
    <ol className="flex gap-1.5" aria-label="Pasos de la reserva">
      {pasos.map((p, i) => {
        const n = i + 1;
        const hecho = n < actual;
        const ahora = n === actual;
        return (
          <li key={p} aria-current={ahora ? "step" : undefined} className="flex-1">
            <span className={`block h-1.5 rounded-full ${hecho ? "bg-farmacia" : ahora ? "bg-amarillo" : "bg-regla"}`} />
            <span className={`mt-1 block text-xs ${ahora ? "font-bold text-tinta" : "text-tinta-2"}`}>
              {hecho ? <span className="sr-only">Listo: </span> : null}
              {p}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function Almanaque(props: {
  estado: Estado;
  mes: string;
  hoy: string;
  disponibilidad: Record<string, number>;
  feriados: Set<string>;
  previo?: string;
  siguiente?: string;
  colorFuerte: string;
  colorTexto: string;
}) {
  const { estado, mes, hoy, disponibilidad, feriados, colorFuerte, colorTexto } = props;
  const [anio, m] = mes.split("-").map(Number);
  const primero = `${mes}-01`;
  const desfase = (new Date(`${primero}T12:00:00Z`).getUTCDay() + 6) % 7;
  const diasEnMes = new Date(Date.UTC(anio, m, 0)).getUTCDate();
  const celdas: (string | null)[] = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`),
  ];
  const conLugar = Object.values(disponibilidad).filter((n) => n > 0).length;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold">2 · Elegí el día</p>
          <h2 id="titulo-mes" className="condensada text-5xl leading-[0.85] font-black uppercase sm:text-7xl">
            {MESES[m - 1]} <span className="text-gris">{anio}</span>
          </h2>
        </div>
        <nav aria-label="Cambiar de mes" className="flex gap-2">
          <MesLink href={props.previo ? href(estado, { mes: props.previo, dia: undefined, p: undefined, h: undefined }) : undefined} etiqueta="Mes anterior">
            ←
          </MesLink>
          <MesLink href={props.siguiente ? href(estado, { mes: props.siguiente, dia: undefined, p: undefined, h: undefined }) : undefined} etiqueta="Mes siguiente">
            →
          </MesLink>
        </nav>
      </div>

      <p className="mb-3 text-sm text-tinta-2">
        {conLugar > 0 ? (
          <>
            <span className={`font-bold ${colorTexto}`}>{conLugar} días con lugar</span> este mes. Los marcados tienen horarios libres.
          </>
        ) : (
          "No quedan días con lugar este mes. Probá el mes siguiente."
        )}
      </p>

      <div className="grid grid-cols-7 border-t-2 border-tinta">
        <div aria-hidden="true" className="contents">
          {DIAS.map((d) => (
            <div
              key={d}
              className={`py-2 text-center text-sm font-bold uppercase ${d === "Do" ? "text-rojo" : "text-tinta-2"}`}
            >
              {d}
            </div>
          ))}
        </div>
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={`v${i}`} aria-hidden="true" className="border-t border-regla" />;
          const n = Number(fecha.slice(8));
          const cerrado = (i % 7 === 6) || feriados.has(fecha);
          const libres = disponibilidad[fecha] ?? 0;
          const elegido = fecha === estado.dia;
          const esHoy = fecha === hoy;
          const etiqueta = `${capitalizar(formatearDiaLargo(fechaAMediodia(fecha)))}${
            cerrado ? ", cerrado" : libres ? `, ${libres} horarios libres` : ", sin horarios"
          }${esHoy ? ", hoy" : ""}`;

          const contenido = (
            <>
              <span className="relative inline-block">
                {esHoy ? (
                  <svg aria-hidden="true" viewBox="0 0 60 44" className="absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)]">
                    <ellipse cx="30" cy="22" rx="27" ry="18" fill="none" stroke="#1f47c8" strokeWidth="2.5" transform="rotate(-6 30 22)" />
                  </svg>
                ) : null}
                <span
                  className={`condensada relative text-3xl leading-none font-black sm:text-5xl ${
                    elegido ? "text-white" : cerrado ? "text-rojo" : libres ? "text-tinta" : "text-gris"
                  }`}
                >
                  {n}
                </span>
              </span>
              <span className={`mt-1 block text-[11px] leading-tight sm:text-xs ${elegido ? "text-white" : libres ? `font-bold ${colorTexto}` : "text-tinta-2"}`}>
                {cerrado ? (feriados.has(fecha) ? "Feriado" : "Cerrado") : libres ? `${libres} libres` : " "}
              </span>
            </>
          );

          const base = "flex min-h-16 flex-col items-center justify-center border-t border-regla py-2 sm:min-h-24";
          return libres > 0 ? (
            <div key={fecha}>
              <Link
                scroll={false}
                href={href(estado, { dia: fecha, p: undefined, h: undefined })}
                aria-label={etiqueta}
                aria-current={elegido ? "date" : undefined}
                className={`${base} relative no-underline transition-colors ${elegido ? colorFuerte : "hover:bg-[#f4f5f6]"}`}
              >
                {!elegido ? <span aria-hidden="true" className={`absolute top-1.5 right-1.5 size-2 rounded-full ${colorFuerte}`} /> : null}
                {contenido}
              </Link>
            </div>
          ) : (
            <div key={fecha} className={base}>
              <span className="sr-only">{etiqueta}</span>
              <span aria-hidden="true" className="contents">{contenido}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MesLink({ href: destino, etiqueta, children }: { href?: string; etiqueta: string; children: React.ReactNode }) {
  const clase = "grid size-12 place-items-center rounded-md border-2 text-2xl font-black no-underline";
  return destino ? (
    <Link scroll={false} href={destino} aria-label={etiqueta} className={`${clase} border-tinta text-tinta hover:bg-tinta hover:text-white`}>
      {children}
    </Link>
  ) : (
    <span aria-hidden="true" className={`${clase} border-regla text-regla`}>
      {children}
    </span>
  );
}

function Horarios({
  estado,
  delDia,
  color,
  disponibilidad,
  dia,
}: {
  estado: Estado;
  delDia: NonNullable<Awaited<ReturnType<typeof horariosDelDia>>>;
  color: (typeof COLOR_ESP)[string];
  disponibilidad: Record<string, number>;
  dia: string;
}) {
  const conHorarios = delDia.profesionales.filter((p) => p.horarios.length > 0);
  if (conHorarios.length === 0) {
    const proximo = Object.keys(disponibilidad)
      .filter((f) => f > dia && disponibilidad[f] > 0)
      .sort()[0];
    return (
      <div className="rounded-md bg-[#f4f5f6] p-4">
        <p className="font-bold">Ese día ya no quedan horarios.</p>
        {proximo ? (
          <Link scroll={false} href={href(estado, { dia: proximo, p: undefined, h: undefined })} className={`mt-1 inline-block font-bold underline ${color.texto}`}>
            Ver el próximo día con lugar: {formatearDiaLargo(fechaAMediodia(proximo))}
          </Link>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {conHorarios.map(({ profesional, horarios }) => (
        <div key={profesional.id}>
          <div className="mb-3 flex items-center gap-3">
            <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full text-base font-black text-white ${color.fuerte}`}>
              {iniciales(profesional.nombre)}
            </span>
            <p className="leading-tight">
              <span className="font-bold">
                {profesional.titulo} {profesional.nombre}
              </span>
              <span className="block text-sm text-tinta-2">Matrícula {profesional.matricula}</span>
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {horarios.map((h) => {
              const iso = h.toISOString();
              const activo = estado.p === profesional.id && estado.h === iso;
              return (
                <li key={iso}>
                  <Link
                    scroll={false}
                    href={href(estado, { p: profesional.id, h: iso })}
                    aria-current={activo ? "true" : undefined}
                    aria-label={`${formatearHora(h)} con ${profesional.titulo} ${profesional.nombre}`}
                    className={`tabular grid h-12 min-w-20 place-items-center rounded-md border-2 px-3 text-lg font-bold no-underline transition-colors ${
                      activo ? `${color.fuerte} border-transparent text-white` : `border-tinta text-tinta hover:bg-tinta hover:text-white`
                    }`}
                  >
                    {formatearHora(h)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
