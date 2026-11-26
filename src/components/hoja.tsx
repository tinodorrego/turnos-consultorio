import { CONSULTORIO } from "@/lib/formato";

/** La hoja del almanaque colgada de la pared: remache arriba y banda impresa del "sponsor". */
export function Hoja({ children, compacta }: { children: React.ReactNode; compacta?: boolean }) {
  return (
    <div className={`relative mx-auto w-full ${compacta ? "max-w-xl" : "max-w-6xl"}`}>
      {/* Remache del que cuelga la hoja */}
      <div aria-hidden="true" className="absolute -top-3 left-1/2 z-10 size-6 -translate-x-1/2 rounded-full bg-farmacia-oscuro shadow-[inset_0_2px_3px_rgba(0,0,0,.45)] ring-4 ring-[#cfd5d2]" />
      <div className="overflow-hidden rounded-md bg-hoja shadow-[0_18px_40px_-12px_rgba(0,0,0,.55),0_2px_6px_rgba(0,0,0,.2)]">
        {children}
      </div>
    </div>
  );
}

export function BandaConsultorio() {
  return (
    <header className="bg-farmacia text-white">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-5 pt-7 pb-4 sm:px-8">
        <div>
          <p className="condensada text-4xl leading-none font-black tracking-[-0.01em] uppercase sm:text-5xl">{CONSULTORIO.nombre}</p>
          <p className="mt-1 text-sm font-semibold text-farmacia-claro">{CONSULTORIO.rubros}</p>
        </div>
        <address className="flex flex-col text-sm leading-snug not-italic text-farmacia-claro sm:ml-auto sm:items-end">
          <span>{CONSULTORIO.direccion}</span>
          <span>
            Tel. {CONSULTORIO.telefono} · {CONSULTORIO.horario}
          </span>
        </address>
      </div>
      <div aria-hidden="true" className="h-2 bg-amarillo" />
    </header>
  );
}

export function PieDemo() {
  return (
    <p className="mx-auto mt-6 max-w-6xl px-2 text-center text-xs text-farmacia-claro">
      Consultorio ficticio de demostración: las personas, la dirección y el teléfono no existen. Proyecto de portfolio con requisitos
      documentados en <code>docs/</code>.
    </p>
  );
}
