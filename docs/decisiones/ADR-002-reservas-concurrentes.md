# ADR-002 · Evitar dobles reservas (RN-04)

**Estado:** aceptada · **Fecha:** 2026-11-26

## Contexto

Dos pacientes pueden ver el mismo horario libre y confirmarlo casi al mismo tiempo. Además, los servicios tienen duraciones distintas: un control de 30' a las 8:30 choca con una primera consulta de 60' a las 8:00 aunque empiecen a horas distintas, así que una restricción única sobre `(profesional, inicio)` no alcanza.

## Decisión

Dentro de la transacción de reserva:

1. `select … from profesionales where id = $1 for update`: serializa las reservas de **ese** profesional (las de otros siguen en paralelo).
2. Se **recalculan los horarios libres** con las mismas reglas que vio el paciente (franjas, anticipación, feriados y turnos tomados).
3. Si el horario pedido ya no está, se rechaza con un mensaje claro; si está, se inserta.

## Alternativas descartadas

- **Restricción de exclusión con `tstzrange`** (`EXCLUDE USING gist`): es la opción más robusta en PostgreSQL, pero requiere la extensión `btree_gist`, que no está disponible en PGlite. Queda como mejora para producción con PostgreSQL real.
- **Bloqueo optimista con reintentos:** más complejo de explicar al paciente y sin ventaja con este volumen.

## Consecuencias

Cubierto por el test "si dos personas reservan el mismo horario a la vez, solo una lo consigue".
