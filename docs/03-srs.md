# 03 · Especificación de requisitos (SRS)

Estructura basada en ISO/IEC/IEEE 29148, reducida a este proyecto. Versión 0.1.

## 1. Propósito

Permitir que los pacientes de un consultorio reserven y cancelen turnos viendo la disponibilidad real, y que el consultorio gestione su agenda, la asistencia y sus indicadores.

## 2. Definiciones

| Término | Definición |
|---|---|
| Franja | Bloque semanal de atención de un profesional (por ejemplo, lunes de 8 a 13). |
| Servicio | Combinación de especialidad y tipo de consulta (primera consulta o control), con su duración. |
| Horario libre | Inicio posible de un turno que cumple todas las reglas. |
| Comprobante | Página del turno con código y link privado de gestión. |

## 3. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Cada servicio tiene su duración: kinesiología y nutrición, 60' la primera consulta y 30' el control; psicología, 60' y 50'. |
| RN-02 | Los turnos empiezan cada 30' dentro de las franjas del profesional y deben terminar dentro de la franja. |
| RN-03 | Se reserva con al menos 2 h de anticipación y hasta 30 días hacia adelante. |
| RN-04 | Un profesional no puede tener dos turnos superpuestos. Dos turnos que solo se tocan (uno termina 10:00, el otro empieza 10:00) no se superponen. |
| RN-05 | El paciente puede cancelar desde su comprobante hasta 24 h antes. Después, tiene que llamar. |
| RN-06 | Domingos y feriados el consultorio está cerrado. |
| RN-07 | Un paciente (identificado por email) puede tener como máximo 2 turnos futuros reservados. |
| RN-08 | La asistencia (vino / no vino) se registra solo sobre turnos reservados y desde su horario de inicio. |

## 4. Requisitos funcionales

| ID | Requisito | Reglas | Prioridad | Estado |
|---|---|---|---|---|
| RF-01 | El sistema debe mostrar un almanaque mensual con los días que tienen horarios libres para la especialidad y el tipo de consulta elegidos, indicando cuántos. | RN-01 a RN-06 | Must | Implementado |
| RF-02 | Al elegir un día, el sistema debe mostrar los horarios libres agrupados por profesional. Si no queda ninguno, debe ofrecer el próximo día con lugar. | RN-01 a RN-06 | Must | Implementado |
| RF-03 | El paciente debe poder reservar con nombre, teléfono, email y cobertura (particular u obra social, y cuál). | RN-04, RN-07 | Must | Implementado |
| RF-04 | Al reservar, el sistema debe mostrar un comprobante con código, los datos del turno, un link privado de gestión y un archivo de calendario con alarma 24 h antes. | — | Must | Implementado |
| RF-05 | El paciente debe poder cancelar desde el comprobante, con confirmación. El horario vuelve a quedar libre. | RN-05 | Must | Implementado |
| RF-06 | El consultorio debe ver la agenda de cualquier día, por profesional. | — | Must | Implementado |
| RF-07 | El consultorio debe poder marcar asistencia (vino / no vino) y cancelar turnos indicando el motivo. | RN-08 | Must | Implementado |
| RF-08 | El panel debe mostrar los indicadores de la semana: ocupación (minutos reservados sobre minutos ofrecidos), ausentismo, turnos, cancelados y ocupación por especialidad. | — | Should | Implementado |
| RF-09 | El sistema debe enviar un recordatorio 24 h antes por email o WhatsApp. | — | Should | Pendiente (mitigado con la alarma del archivo de calendario) |
| RF-10 | El consultorio debe poder editar franjas y bloquear días u horarios desde el panel. | RN-02 | Should | Pendiente (hoy se cargan por semilla) |

## 5. Requisitos no funcionales

| ID | Requisito | Estado |
|---|---|---|
| RNF-01 | Toda entrada se valida en el servidor y los horarios se recalculan al reservar: el sistema no confía en lo que manda el navegador. | Implementado |
| RNF-02 | Mobile first y accesible: controles de al menos 44 px de alto, contraste AA, información que no depende solo del color (los días cerrados dicen "Cerrado" o "Feriado") y navegación por teclado. | Implementado |
| RNF-03 | El panel requiere autenticación del personal. | Pendiente |
| RNF-04 | Lint, tipos, tests y build pasan en CI en cada cambio. | Implementado |
| RNF-05 | Privacidad: sin datos clínicos; el comprobante solo se muestra con el token del link; el token se guarda hasheado (SHA-256). | Implementado |
| RNF-06 | Fechas guardadas con zona horaria y mostradas en hora de Argentina. | Implementado |

Siguiente: [04 · Historias de usuario](04-historias.md).
