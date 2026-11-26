/**
 * Carga turnos ficticios desde 6 días atrás hasta 10 días adelante: los pasados con asistencia
 * registrada y los futuros reservados, para que almanaque, panel e indicadores tengan datos.
 *   npm run db:demo            carga solo si no hay turnos
 *   npm run db:demo -- --reset borra los turnos y vuelve a cargar
 * Usa los mismos casos de uso que la app, así que respeta todas las reglas (RN-01 a RN-08).
 */
import { sql } from "drizzle-orm";
import { obtenerDb } from "@/db/client";
import { turnos } from "@/db/schema";
import { fechaLocal, sumarDias, TIPOS } from "@/domain/agenda";
import { cancelarPorConsultorio, horariosDelDia, obtenerCatalogo, registrarAsistencia, reservar } from "@/services/turnos";

const NOMBRES = [
  "Laura Gómez", "Diego Fernández", "Sofía Martínez", "Pablo Romero", "Carolina Díaz", "Martín Acosta", "Valeria Sosa",
  "Nicolás Herrera", "Florencia Medina", "Gustavo Ruiz", "Agustina Castro", "Hernán Molina", "Camila Ortiz", "Ricardo Benítez",
  "Paula Navarro", "Federico Luna", "Mariana Silva", "Javier Torres", "Lucía Peralta", "Sebastián Vera",
];
const OBRAS = ["OSDE", "Swiss Medical", "Galeno", "IOMA", "OSECAC"];

// Generador pseudoaleatorio con semilla fija: la demo sale igual cada vez.
let semilla = 42;
const azar = () => ((semilla = (semilla * 1664525 + 1013904223) % 4294967296) / 4294967296);

async function main() {
  const db = await obtenerDb();
  if (process.argv.includes("--reset")) await db.execute(sql`truncate table turnos restart identity`);
  else if ((await db.select({ id: turnos.id }).from(turnos).limit(1)).length) {
    console.log("Ya hay turnos. Usá `npm run db:demo -- --reset` para reemplazarlos.");
    return;
  }

  const catalogo = await obtenerCatalogo(db);
  const hoy = fechaLocal(new Date());
  let n = 0;
  let cargados = 0;

  for (let d = -6; d <= 10; d++) {
    const fecha = sumarDias(hoy, d);
    // Para cargar el pasado, se "reserva" como si fuera 3 días antes de cada fecha.
    const momentoReserva = new Date(Math.min(Date.now(), new Date(`${sumarDias(fecha, -3)}T09:00:00-03:00`).getTime()));
    for (const esp of catalogo) {
      for (const tipo of TIPOS) {
        const { profesionales, servicio } = await horariosDelDia(db, { especialidadId: esp.id, tipo, fecha, ahora: momentoReserva });
        for (const { profesional, horarios } of profesionales) {
          // Más demanda cerca de hoy; primera consulta menos frecuente que control.
          const probabilidad = (d < 0 ? 0.5 : d <= 3 ? 0.45 : 0.22) * (tipo === "PRIMERA" ? 0.5 : 1);
          for (const inicio of horarios) {
            if (azar() > probabilidad) continue;
            const nombre = NOMBRES[Math.floor(azar() * NOMBRES.length)];
            const obra = azar() < 0.6;
            try {
              const { turno } = await reservar(
                db,
                {
                  profesionalId: profesional.id,
                  servicioId: servicio.id,
                  inicio: inicio.toISOString(),
                  nombre,
                  email: `paciente${++n}@ejemplo.test`,
                  telefono: `11 5${String(1000 + n).slice(-3)}-${String(1000 + ((n * 37) % 9000)).slice(-4)}`,
                  cobertura: obra ? "OBRA_SOCIAL" : "PARTICULAR",
                  obraSocial: obra ? OBRAS[Math.floor(azar() * OBRAS.length)] : undefined,
                },
                momentoReserva,
              );
              cargados++;
              const despues = new Date(turno.fin.getTime() + 60 * 60 * 1000);
              if (despues.getTime() < Date.now()) {
                await registrarAsistencia(db, { turnoId: turno.id, estado: azar() < 0.14 ? "AUSENTE" : "ATENDIDO" }, despues);
              } else if (azar() < 0.06) {
                await cancelarPorConsultorio(db, { turnoId: turno.id, motivo: "Reprogramado a pedido del paciente" }, momentoReserva);
              }
            } catch {
              // Horario tomado por otro turno más largo en este mismo recorrido: se saltea.
            }
          }
        }
      }
    }
  }
  console.log(`Cargados ${cargados} turnos de demostración.`);
}

main().then(() => process.exit(0));
