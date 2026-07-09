import { SectionTitle } from "@/components/ui/section-title";

function RuleBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="fantasy-panel space-y-2 p-4">
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
        Liga casual de Age of Sigmar: Spearhead. Sin jornadas ni rondas fijas:
        la temporada es continua y cada jugador participa según su disponibilidad.
      </p>

      <div className="space-y-3">
        <RuleBlock title="Puntuación">
          <ul className="list-inside list-disc space-y-1 text-[var(--muted)]">
            <li>
              <strong className="text-[var(--foreground)]">Victoria:</strong> 2
              puntos de liga
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Empate:</strong> 1
              punto de liga
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Derrota:</strong> 0
              puntos de liga
            </li>
          </ul>
          <p className="text-[var(--muted)]">
            La clasificación se ordena por puntos de liga.
          </p>
        </RuleBlock>

        <RuleBlock title="Hándicap">
          <p className="text-[var(--muted)]">
            Antes de cada partida se calcula la diferencia de puntos entre ambos
            jugadores. Quien lleva menos puntos recibe{" "}
            <strong className="text-[var(--foreground)]">
              +1 Punto de Victoria (PV) inicial por cada 4 puntos completos de
              diferencia
            </strong>
            , aplicado solo al marcador inicial del escenario Spearhead.
          </p>
          <table className="w-full text-left text-xs text-[var(--muted)]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-1.5 pr-4 font-medium text-[var(--accent)]">
                  Diferencia
                </th>
                <th className="py-1.5 font-medium text-[var(--accent)]">
                  Bonus PV
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
            Cada jugador indica en qué días y franjas (mañana o tarde) puede
            jugar durante los próximos 7 días. Puede actualizarla en cualquier
            momento.
          </p>
        </RuleBlock>

        <RuleBlock title="Emparejamientos">
          <p className="text-[var(--muted)]">
            Los emparejamientos son automáticos, no manuales. Se recalculan al
            actualizar la disponibilidad, al registrar un resultado o al cancelar
            un partido.
          </p>
          <p className="text-[var(--muted)]">Prioridades del algoritmo:</p>
          <ol className="list-inside list-decimal space-y-1 text-[var(--muted)]">
            <li>Favorecer el todos contra todos (rivales aún no enfrentados).</li>
            <li>Ayudar a quien lleva menos partidas disputadas.</li>
            <li>Solo proponer enfrentamientos con disponibilidad compatible.</li>
            <li>Evitar repetir el mismo rival de forma consecutiva.</li>
          </ol>
        </RuleBlock>

        <RuleBlock title="Registro de resultados">
          <p className="text-[var(--muted)]">
            Tras cada partida se registran jugadores, resultado y fecha. Al
            guardarse, se actualiza la clasificación y se recalculan los
            hándicaps.
          </p>
        </RuleBlock>
      </div>
    </section>
  );
}
