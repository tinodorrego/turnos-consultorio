# 07 · Plan de validación UX

> **Estado: planificado, no ejecutado.** El consultorio es ficticio, así que todavía no hay pruebas con usuarios ni métricas reales. Este documento define cómo se validará con un consultorio real. No se publicarán resultados que no hayan ocurrido.

## Decisiones de diseño a validar

| ID | Hipótesis | Por qué la tomamos |
|---|---|---|
| H-01 | Mostrar el almanaque con disponibilidad de entrada (en lugar de un botón "Reservar") reduce el tiempo hasta reservar. | El paciente viene a saber *cuándo*; la respuesta tiene que estar en la primera pantalla. |
| H-02 | Un objeto conocido (el almanaque de farmacia) baja la carga cognitiva de las personas mayores frente a un selector de fecha genérico. | Es un objeto que la mayoría tuvo colgado en la cocina; números grandes y domingos en rojo. |
| H-03 | Pedir los datos recién al final, y solo tres, reduce el abandono. | Cada campo previo a ver disponibilidad es una razón para irse. |
| H-04 | Cancelar con un toque desde el comprobante reduce el ausentismo. | Hoy el costo de avisar (escribir, llamar) es mayor que el de no ir. |

## Prueba de usabilidad moderada

- **Participantes:** 5 pacientes reales del consultorio, con al menos 2 mayores de 60 años. Celular propio.
- **Tareas:**
  1. "Sacá un turno de kinesiología, primera consulta, para la semana que viene a la tarde."
  2. "Te surgió algo: cancelá ese turno."
  3. "¿Qué día de esta semana podrías ver a la nutricionista lo antes posible?"
- **Métricas:** tasa de éxito por tarea, tiempo hasta confirmar, errores (toques en días sin lugar, campos con error) y SEQ (1–7) por tarea.
- **Criterio de éxito:** 5 de 5 completan la tarea 1 sin ayuda, en menos de 90 segundos de mediana.

## Métricas después del lanzamiento (4 semanas antes contra 4 semanas después)

| Métrica | Fuente | Objetivo |
|---|---|---|
| Reservas online / total | `turnos.creado_en` contra la agenda de papel | > 60 % |
| Ausentismo | Panel (RF-08) | Bajar al menos 5 puntos |
| Mensajes de WhatsApp para pedir turno por semana | Conteo de la recepción | Bajar a la mitad |
| Cancelaciones con más de 24 h | `turnos` con estado cancelado | Subir |

Los hallazgos se registrarán acá con fecha, sin editar los anteriores.
