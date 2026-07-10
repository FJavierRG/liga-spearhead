import { SectionTitle } from "@/components/ui/section-title";

function RuleBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="fantasy-panel fantasy-panel-torn space-y-2 p-4">
      <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--accent)]">
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--foreground)]">
        {children}
      </div>
    </article>
  );
}

export function ReglasPanel() {
  return (
    <section className="space-y-4">
      <SectionTitle>Reglas del formato</SectionTitle>
      <p className="text-sm text-[var(--muted)]">
        Liga sevillana de Age of Sigmar: Spearhead. Sin jornadas ni rondas fijas:
        la temporada es continua y cada jugador participa según su disponibilidad.
      </p>

      <div className="space-y-3">
        <RuleBlock title="Puntuación">
        <p className="text-[var(--muted)]">
            La clasificación se ordena por Puntos de Liga (PL).
          </p>
          <ul className="list-inside list-disc space-y-1 text-[var(--muted)]">
            <li>
              <strong className="text-[var(--foreground)]">Victoria:</strong> 2PL
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Empate:</strong> 1PL
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Derrota:</strong> 0PL
            </li>
          </ul>

        </RuleBlock>

        <RuleBlock title="¿Y si no tienes mucho tiempo...? Sistema de underdog.">
          <p className="text-[var(--muted)]">
            Antes de cada partida se calcula la diferencia de puntos entre ambos
            jugadores. Si ganas estando por detrás, la victoria te da{" "}
            <strong className="text-[var(--foreground)]">
              +1 Punto de Liga (PL) extra por cada 4 PLs completos de
              diferencia
            </strong>
            , además de los 2 PL habituales por ganar.
          </p>
          <table className="w-full text-left text-xs text-[var(--muted)]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-1.5 pr-4 font-medium text-[var(--accent)]">
                  Diferencia
                </th>
                <th className="py-1.5 font-medium text-[var(--accent)]">
                  Bonus PL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">0–3</td>
                <td className="py-1">+0</td>
              </tr>
              <tr>
                <td className="py-1">4–7</td>
                <td className="py-1">+1</td>
              </tr>
              <tr>
                <td className="py-1">8–11</td>
                <td className="py-1">+2</td>
              </tr>
              <tr>
                <td className="py-1">12–15</td>
                <td className="py-1">+3</td>
              </tr>
            </tbody>
          </table>
        </RuleBlock>

        <RuleBlock title="Disponibilidad">
          <p className="text-[var(--muted)]">
            Cada jugador indica en la web en qué días y franjas (mañana o tarde) puede
            jugar durante los próximos 7 días. El sistema de emparejamientos se encarga de asignar los partidos de forma automática.
          </p>
        </RuleBlock>

        <RuleBlock title="Emparejamientos">
          <p className="text-[var(--muted)]">
            Los emparejamientos se calculan los
            lunes a las 01:00. Si un partido se cancela, se intenta reasignar a
            los jugadores afectados con la disponibilidad restante de la semana.
          </p>
          <p className="text-[var(--muted)]">Prioridades del algoritmo:</p>
          <ol className="list-inside list-decimal space-y-1 text-[var(--muted)]">
            <li>Favorecer el todos contra todos.</li>
            <li>Ayudar a quien lleva menos partidas disputadas.</li>
            <li>Solo proponer enfrentamientos con disponibilidad compatible.</li>
            <li>Evitar repetir el mismo rival de forma consecutiva.</li>
          </ol>
        </RuleBlock>

        <RuleBlock title="Registro de resultados">
          <p className="text-[var(--muted)]">
            Tras cada partida cualquiera de los dos jugadores debe registrar el resultado en la web. 
            El resultado se utilizará para calcular los puntos de liga de ambos jugadores y los emparejamientos para la siguiente semana.
          </p>
        </RuleBlock>
      </div>
    </section>
  );
}
