# 01 · Relevamiento

> **Caso de estudio ficticio.** "Centro Sereno" no existe: es un consultorio modelo construido a partir de cómo trabajan los consultorios chicos en Buenos Aires. El proyecto está preparado para validarse con un consultorio real (ver [07 · Validación UX](07-validacion-ux.md)). Ningún dato de este documento proviene de entrevistas reales.

## Contexto

Consultorio multidisciplinario con kinesiología, nutrición y psicología: cuatro profesionales y una recepcionista de medio tiempo. Hoy los turnos se piden por WhatsApp, por teléfono o en persona, y se anotan en una agenda de papel por profesional.

## Partes interesadas

| Rol | Necesidad principal |
|---|---|
| Paciente | Saber cuándo lo pueden atender y reservar sin esperar respuesta. Poder cancelar fácil. |
| Recepcionista | Dejar de contestar "¿tenés algo el jueves?" todo el día. Ver la agenda del día de un vistazo. |
| Profesional | Que no se superpongan turnos. Saber quién vino y quién no. |
| Dirección | Conocer la ocupación y el ausentismo para decidir horarios. |

## Proceso actual y problemas

| ID | Problema | Consecuencia |
|---|---|---|
| P-01 | El paciente no ve la disponibilidad: pregunta y espera respuesta | Turnos que se pierden porque el paciente reserva en otro lado |
| P-02 | La recepcionista responde mensajes fuera de horario | Sobrecarga y errores al anotar |
| P-03 | Dos personas anotan en la misma agenda de papel | Turnos superpuestos |
| P-04 | Cancelar requiere escribir o llamar | El paciente no avisa y el horario queda vacío (ausentismo) |
| P-05 | No hay registro de asistencia ni de ocupación | No se puede medir ni mejorar |

## Objetivos

| ID | Objetivo | Problemas | Indicador |
|---|---|---|---|
| OBJ-01 | El paciente ve los horarios libres y reserva solo | P-01, P-02 | Reservas online / total de reservas |
| OBJ-02 | Ningún turno se superpone | P-03 | Superposiciones = 0 |
| OBJ-03 | Cancelar es tan fácil como reservar | P-04 | Ausentismo semanal |
| OBJ-04 | El consultorio mide ocupación y ausentismo | P-05 | Disponibles en el panel |

## Alcance

**v0.1:** reserva pública (almanaque, horarios, datos mínimos), comprobante con cancelación y archivo de calendario, y panel con agenda del día, asistencia, cancelación con motivo e indicadores semanales.

**Próximas versiones:** recordatorios automáticos por email o WhatsApp (RF-09), gestión de horarios y bloqueos desde el panel (RF-10) e inicio de sesión del personal (RNF-03).

**Fuera de alcance:** historia clínica, cobro online y facturación a obras sociales.

Siguiente: [02 · Procesos](02-procesos.md).
