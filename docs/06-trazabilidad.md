# 06 · Matriz de trazabilidad

Cada test cita en su nombre el ID que verifica: buscar un ID en el repositorio muestra toda su cadena.

| Objetivo | Requisito | Reglas | Historia | Tests | Código | Estado |
|---|---|---|---|---|---|---|
| OBJ-01 | RF-01 | RN-01 a RN-06 | HU-01 | `reservas › RF-01` · `agenda › RN-03` · `agenda › RN-06` | `services/turnos.ts › disponibilidadPorDia` · `app/page.tsx › Almanaque` | ✅ |
| OBJ-01 | RF-02 | RN-01 a RN-06 | HU-02 | `reservas › RF-02` · `agenda › RN-01 / RN-02` | `domain/agenda.ts › generarHorarios` · `app/page.tsx › Horarios` | ✅ |
| OBJ-01, OBJ-02 | RF-03 | RN-04, RN-07 | HU-03 | `reservas › RF-03 / RF-04 / RN-04` · `agenda › RF-03` | `services/turnos.ts › reservar` · `app/form-reserva.tsx` · `app/acciones.ts` | ✅ |
| OBJ-01 | RF-04 | — | HU-03 | `reservas › reserva, devuelve código y token…` | `app/turno/[codigo]/` · `app/turno/[codigo]/calendario/route.ts` | ✅ |
| OBJ-03 | RF-05 | RN-05 | HU-04 | `reservas › RF-05 / RN-05` · `agenda › RN-05` | `services/turnos.ts › cancelarPorPaciente` · `boton-cancelar.tsx` | ✅ |
| OBJ-04 | RF-06 | — | HU-05 | `reservas › RF-06 / RF-07 / RN-08` | `services/turnos.ts › agendaDelDia` · `app/panel/` | ✅ |
| OBJ-03, OBJ-04 | RF-07 | RN-08 | HU-05 | `reservas › RF-06 / RF-07 / RN-08` · `agenda › RN-08` | `services/turnos.ts › registrarAsistencia, cancelarPorConsultorio` | ✅ |
| OBJ-04 | RF-08 | — | HU-06 | `reservas › RF-08` | `services/turnos.ts › obtenerIndicadores` · `app/panel/page.tsx` | ✅ |
| OBJ-03 | RF-09 | — | — | — | Alarma de 24 h en el `.ics` como mitigación | ⬜ pendiente |
| OBJ-04 | RF-10 | RN-02 | — | — | Franjas por semilla (`db/seed.ts`) | ⬜ pendiente |
| OBJ-02 | — | RN-04 | HU-03 | `reservas › si dos personas reservan el mismo horario a la vez…` | `reservar`: `select … for update` del profesional ([ADR-002](decisiones/ADR-002-reservas-concurrentes.md)) | ✅ |
| — | RNF-05 | — | — | `reservas › RF-05 / RN-05 › rechaza un token inválido` | `hashToken` · comprobante exige token | ✅ |

**Cobertura v0.1:** 8 de 10 requisitos funcionales implementados, todos con tests que citan su ID. RF-09 y RF-10 están documentados como próximos pasos.
