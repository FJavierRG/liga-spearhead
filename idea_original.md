# Documento de diseño — Liga Local Age of Sigmar: Spearhead

## Objetivo

Crear una liga casual que permita:

- Jugar tantas partidas como cada persona quiera.
- No penalizar a los jugadores con mayor disponibilidad.
- Evitar que los jugadores menos activos se desenganchen rápidamente.
- Automatizar los emparejamientos en función de la disponibilidad y del estado de la liga.
- Mantener un sistema transparente, sencillo de entender y fácil de gestionar.

No existen jornadas ni rondas. La liga es continua durante toda la temporada.

---

## Sistema de puntuación

Cada partida otorga:

- Victoria: 2 puntos de liga.
- Empate: 1 punto de liga.
- Derrota: 0 puntos de liga.

La clasificación se ordena por puntos de liga.

---

## Sistema de hándicap

Antes de comenzar una partida se calcula la diferencia de puntos de liga entre ambos jugadores.

El jugador con menos puntos recibe **+1 Punto de Victoria (PV) inicial por cada 4 puntos de liga completos de diferencia.**

Ejemplos:

| Diferencia | Bonus |
|------------|-------|
| 0–3 | +0 PV |
| 4–7 | +1 PV |
| 8–11 | +2 PV |
| 12–15 | +3 PV |

El bonus se añade únicamente al marcador inicial del escenario de Spearhead.

Este sistema busca compensar el efecto de jugar más partidas sin impedir que los jugadores más activos sigan progresando.

---

## Disponibilidad

Cada jugador mantiene actualizada su disponibilidad para los próximos **7 días**.

Puede indicar los días y franjas horarias en las que está disponible para jugar.

La disponibilidad puede modificarse en cualquier momento.

---

## Sistema de emparejamientos

Los emparejamientos no son manuales. La web asigna partidos programados según disponibilidad y estado de la liga.

No existen rondas fijas. La semana va de lunes a domingo.

### Calendario

| Momento | Qué ocurre |
|---------|------------|
| Durante la semana | Los jugadores actualizan disponibilidad para la semana siguiente |
| Viernes 20:00 | Emparejamiento principal de la semana siguiente |
| Sábado 23:00 | Segunda oportunidad para quien sigue sin partido |
| Domingo 23:00 | Última segunda oportunidad |

Actualizar disponibilidad **no** dispara un recálculo inmediato (evita abuso). Los repasos de fin de semana recogen a quien añadió huecos después del viernes.

Si un partido se cancela, se intenta reemparejar a los afectados con la disponibilidad restante de esa semana.

Detalle técnico de implementación: [`docs/EMPAREJAMIENTOS.md`](docs/EMPAREJAMIENTOS.md).

---

## Filosofía de emparejamiento

El sistema debe intentar cumplir estos objetivos en orden de prioridad.

### 1. Favorecer el todos contra todos

Mientras existan rivales disponibles con los que un jugador aún no se haya enfrentado, estos tendrán siempre prioridad.

El sistema intentará completar un primer ciclo de enfrentamientos antes de comenzar a repetir rivales.

### 2. Ayudar a quien lleva menos partidas

Entre varios rivales posibles, tendrá prioridad quien haya disputado menos partidas.

Esto evita que un jugador quede descolgado simplemente porque durante una semana o dos haya tenido menos disponibilidad.

### 3. Maximizar coincidencias reales

Solo deben proponerse enfrentamientos entre jugadores cuya disponibilidad sea compatible.

### 4. Evitar repeticiones inmediatas

Siempre que sea posible:

- No repetir rival de forma consecutiva.
- No enfrentar repetidamente a dos jugadores mientras existan alternativas válidas.

---

## Algoritmo de prioridad

Cada posible enfrentamiento recibe una puntuación basada en los criterios anteriores.

A igualdad de condiciones, el sistema priorizará:

1. Rivales que aún no se hayan enfrentado.
2. Rivales con menos partidas disputadas.
3. Mayor coincidencia de disponibilidad.
4. Evitar enfrentamientos repetidos de forma reciente.

La ponderación concreta de estos criterios podrá ajustarse tras las primeras semanas de funcionamiento de la liga.

---

## Flujo de la web

Cada jugador podrá consultar:

- Su posición en la clasificación.
- Sus puntos de liga.
- Las partidas disputadas.
- El siguiente rival recomendado.
- El hándicap correspondiente para ese enfrentamiento.
- Su disponibilidad para los próximos siete días.
- El historial de partidas.

---

## Registro de resultados

Tras cada partida se registrará:

- Jugador A.
- Jugador B.
- Resultado (victoria, empate o derrota).
- Fecha.

Al registrarse un resultado:

- Se actualiza la clasificación.
- Se recalculan los hándicaps.
- Los emparejamientos de la semana en curso no se regeneran por completo; solo se ajustan si un partido programado se cancela o completa.

---

## Clasificación

La clasificación mostrará, como mínimo:

- Posición.
- Jugador.
- Partidas jugadas.
- Victorias.
- Empates.
- Derrotas.
- Puntos de liga.

---

## Filosofía general

La liga está diseñada para favorecer la flexibilidad sin perder un mínimo de estructura organizativa.

Cada jugador participa al ritmo que le permita su disponibilidad, mientras que la web actúa como organizador automático, proponiendo enfrentamientos que favorezcan la variedad de rivales, faciliten que todos puedan mantenerse activos y reduzcan el efecto que tiene disputar un mayor número de partidas sobre la clasificación.

El sistema de hándicap complementa esta filosofía, equilibrando los enfrentamientos entre jugadores con distinta progresión en la liga sin limitar el número de partidas que cada uno puede disputar.