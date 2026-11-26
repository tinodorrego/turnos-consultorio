# 02 · Procesos (AS-IS / TO-BE)

BPMN simplificado en Mermaid: carriles por rol, eventos, tareas y compuertas.

## AS-IS: pedir un turno hoy

```mermaid
flowchart LR
  subgraph PA[Paciente]
    A((Inicio)) --> B[Escribe por WhatsApp: ¿tenés turno el jueves?]
    B --> C{¿Le sirve el horario ofrecido?}
    C -- No --> B
    C -- Sí --> D[Confirma por mensaje]
  end
  subgraph RE[Recepción]
    B --> E[Lee el mensaje cuando puede]
    E --> F[Busca en la agenda de papel del profesional]
    F --> G[Ofrece horarios por mensaje]
    G --> C
    D --> H[Anota el turno a mano]
  end
  H --> I((Turno anotado))
```

Puntos de dolor: espera entre mensajes (P-01, P-02), anotación manual (P-03) y ningún mecanismo para cancelar (P-04).

## TO-BE: reserva online

```mermaid
flowchart LR
  subgraph PA[Paciente]
    A((Inicio)) --> B[Elige especialidad y tipo de consulta]
    B --> C[Ve el almanaque con los días con lugar]
    C --> D[Elige día y horario]
    D --> E[Deja nombre, teléfono y email]
  end
  subgraph SI[Sistema]
    C -.calcula.-> R1[Horarios libres · RN-01 a RN-06]
    E --> F{¿Sigue libre? · RN-04}
    F -- No --> D
    F -- Sí --> G[Crea el turno y el comprobante con link · RF-04]
  end
  subgraph CO[Comprobante]
    G --> H{¿Puede venir?}
    H -- No, con 24 h o más --> X[Cancela con un toque · RN-05]
    H -- Sí --> J((Turno))
  end
  X --> L[El horario vuelve a estar libre]
```

## Ciclo de vida del turno (RN-08)

```mermaid
stateDiagram-v2
  [*] --> RESERVADO: reserva online
  RESERVADO --> CANCELADO: paciente (≥ 24 h) o consultorio (con motivo)
  RESERVADO --> ATENDIDO: desde el horario del turno
  RESERVADO --> AUSENTE: desde el horario del turno
  ATENDIDO --> [*]
  AUSENTE --> [*]
  CANCELADO --> [*]
```

Siguiente: [03 · SRS](03-srs.md).
