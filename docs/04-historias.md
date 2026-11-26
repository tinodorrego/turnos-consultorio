# 04 · Historias de usuario

Formato INVEST, con criterios de aceptación en Gherkin. Cada historia indica qué tests la verifican.

---

## HU-01 · Ver cuándo me pueden atender

**Como** paciente, **quiero** ver de entrada los días con lugar **para** no tener que preguntar y esperar.

Cubre: RF-01 · Estado: **Hecha**

```gherkin
Escenario: Almanaque con disponibilidad
  Dado que elijo Kinesiología y "Sí, primera consulta"
  Entonces veo el mes con los días que tienen horarios libres marcados y cuántos quedan
  Y los domingos y feriados aparecen en rojo como "Cerrado" o "Feriado"

Escenario: Fuera del horizonte
  Entonces no puedo elegir días pasados ni a más de 30 días
```

Verificación: `reservas.test.ts › RF-01`, `agenda.test.ts › RN-03`, `agenda.test.ts › RN-06`.

---

## HU-02 · Elegir horario y profesional

**Como** paciente, **quiero** ver los horarios de ese día con cada profesional **para** elegir el que me queda cómodo.

Cubre: RF-02 · Estado: **Hecha**

```gherkin
Escenario: Horarios por profesional
  Cuando toco el lunes 7
  Entonces veo los horarios libres de cada profesional que atiende ese día
  Y los de 60' no aparecen si pisan un turno ya tomado

Escenario: Día sin lugar
  Dado un día que ya no tiene horarios
  Entonces el sistema me ofrece ir al próximo día con lugar
```

Verificación: `reservas.test.ts › RF-02`, `agenda.test.ts › RN-01 / RN-02`, `agenda.test.ts › RN-04`.

---

## HU-03 · Reservar con pocos datos

**Como** paciente, **quiero** reservar dejando solo lo necesario **para** terminar en menos de un minuto.

Cubre: RF-03, RF-04 · Estado: **Hecha**

```gherkin
Escenario: Reserva exitosa
  Dado que elegí un horario
  Cuando completo nombre, teléfono y email y confirmo
  Entonces veo "¡Listo, tenés turno!" y el comprobante con un código
  Y puedo agregarlo a mi calendario

Escenario: Alguien lo tomó antes
  Dado que otra persona confirmó ese horario un segundo antes
  Cuando confirmo
  Entonces veo "Ese horario ya no está disponible. Elegí otro, por favor."

Escenario: Obra social
  Cuando elijo "Obra social / prepaga" y no digo cuál
  Entonces el sistema me la pide antes de reservar
```

Verificación: `reservas.test.ts › RF-03 / RF-04 / RN-04` (incluye dos reservas simultáneas), `agenda.test.ts › RF-03`.

---

## HU-04 · Cancelar sin llamar

**Como** paciente, **quiero** cancelar desde el comprobante **para** liberar el horario sin tener que escribir.

Cubre: RF-05 · Estado: **Hecha**

```gherkin
Escenario: Cancelación a tiempo
  Dado un turno dentro de 3 días
  Cuando toco "Cancelar el turno" y confirmo
  Entonces el comprobante muestra el sello "Cancelado" y el horario vuelve al almanaque

Escenario: Menos de 24 h
  Dado un turno para dentro de 20 horas
  Entonces no veo el botón y el comprobante me indica el teléfono del consultorio
```

Verificación: `reservas.test.ts › RF-05 / RN-05`, `agenda.test.ts › RN-05`.

---

## HU-05 · Ver la agenda del día

**Como** recepcionista, **quiero** la agenda del día por profesional **para** recibir a cada paciente.

Cubre: RF-06, RF-07 · Estado: **Hecha**

```gherkin
Escenario: Asistencia
  Dado un turno que ya empezó
  Cuando marco "No vino"
  Entonces el turno queda como ausente y cuenta en el ausentismo

Escenario: Todavía no empezó
  Entonces solo puedo cancelarlo, indicando el motivo
```

Verificación: `reservas.test.ts › RF-06 / RF-07 / RN-08`.

---

## HU-06 · Medir ocupación y ausentismo

**Como** dirección del consultorio, **quiero** los indicadores de la semana **para** decidir horarios y medir el efecto de la reserva online.

Cubre: RF-08 · Estado: **Hecha**

```gherkin
Escenario: Indicadores
  Dado un lunes con 540 minutos ofrecidos y dos turnos de 60', uno atendido y otro ausente
  Entonces la ocupación es 22 % y el ausentismo 50 %
```

Verificación: `reservas.test.ts › RF-08`.

Siguiente: [05 · Modelo de datos](05-modelo-datos.md).
