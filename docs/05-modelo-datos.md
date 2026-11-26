# 05 · Modelo de datos

Fuente de verdad: [`src/db/schema.ts`](../src/db/schema.ts). Migraciones en [`drizzle/`](../drizzle/).

```mermaid
erDiagram
  ESPECIALIDADES ||--|{ SERVICIOS : "ofrece"
  ESPECIALIDADES ||--|{ PROFESIONALES : "agrupa"
  PROFESIONALES ||--|{ FRANJAS : "atiende en"
  PROFESIONALES ||--o{ TURNOS : "tiene"
  SERVICIOS ||--o{ TURNOS : "define duración de"

  ESPECIALIDADES {
    serial id PK
    varchar slug UK
    varchar nombre
    text descripcion
    smallint orden
  }
  SERVICIOS {
    serial id PK
    integer especialidad_id FK
    tipo_consulta tipo "PRIMERA | CONTROL"
    smallint duracion_min "RN-01"
  }
  PROFESIONALES {
    serial id PK
    integer especialidad_id FK
    varchar nombre
    varchar titulo
    varchar matricula
    boolean activo
  }
  FRANJAS {
    serial id PK
    integer profesional_id FK
    smallint dia_semana "1 lunes … 6 sábado"
    time desde
    time hasta
  }
  FERIADOS {
    date fecha PK
    varchar nombre
  }
  TURNOS {
    serial id PK
    varchar codigo UK "6 caracteres sin 0/O/1/I"
    integer profesional_id FK
    integer servicio_id FK
    timestamptz inicio
    timestamptz fin
    estado_turno estado "RESERVADO | ATENDIDO | AUSENTE | CANCELADO"
    varchar paciente_nombre
    varchar paciente_email
    varchar paciente_telefono
    cobertura cobertura
    varchar obra_social
    varchar token_hash "SHA-256 del link"
    timestamptz creado_en
    timestamptz actualizado_en
    text motivo_cancelacion
  }
```

## Decisiones de modelado

- **`fin` persistido** además de `inicio`: la superposición (RN-04) se calcula sin unir con servicios, y si mañana cambia la duración de un servicio, los turnos existentes conservan la suya.
- **Los horarios libres no se guardan:** se calculan con las franjas, los turnos y los feriados. No hay "slots" que sincronizar.
- **Token hasheado:** si se filtra la base, nadie puede cancelar turnos ajenos con los links.
- **Índice `(profesional_id, inicio)`** para calcular la disponibilidad de un rango de días con una sola consulta por especialidad.

Siguiente: [06 · Matriz de trazabilidad](06-trazabilidad.md).
