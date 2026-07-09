/**
 * Pruebas manuales del algoritmo de emparejamiento.
 * Ejecutar: npx tsx src/lib/league/__tests__/matching-scenarios.ts
 */

import { writeFileSync } from "fs";
import { generateWeeklySchedule } from "../weekly-schedule";
import type { Availability, Match, ScheduledMatch, User } from "../../../types/database";

const lines: string[] = [];

// ─── helpers ────────────────────────────────────────────────────────────────

function user(id: string, nombre: string): User {
  return {
    id,
    auth_user_id: id,
    nombre,
    avatar_url: null,
    faccion: null,
    rol: "jugador",
    reglas_pendientes: false,
    created_at: "2024-01-01T00:00:00Z",
  };
}

function avail(jugador_id: string, fecha: string, franja: "manana" | "tarde"): Availability {
  return { id: `${jugador_id}-${fecha}-${franja}`, jugador_id, fecha, franja, disponible: true };
}

function match(jugador_a: string, jugador_b: string, fecha = "2024-01-01"): Match {
  return {
    id: `m-${jugador_a}-${jugador_b}`,
    season_id: "s1",
    jugador_a,
    jugador_b,
    resultado: "victoria_jugador_a",
    fecha,
    created_by: jugador_a,
    created_at: fecha + "T00:00:00Z",
  };
}

const SEASON = "s1";
const WEEK = "2024-01-08"; // lunes

function log(s: string) { lines.push(s); }

function run(
  title: string,
  users: User[],
  availability: Availability[],
  played: Match[] = [],
  existing: ScheduledMatch[] = []
) {
  log(`\n${"─".repeat(60)}`);
  log(`▶ ${title}`);
  log("─".repeat(60));

  const result = generateWeeklySchedule(SEASON, WEEK, users, availability, played, existing);
  const newPairs = result.filter((s) => s.status === "programado" && !existing.some((e) => e.id === s.id));
  const matchedIds = new Set(newPairs.flatMap((s) => [s.jugador_a, s.jugador_b]));
  const unmatched = users.filter((u) => !matchedIds.has(u.id));

  if (newPairs.length === 0) {
    log("  Sin emparejamientos nuevos.");
  } else {
    for (const s of newPairs) {
      const a = users.find((u) => u.id === s.jugador_a)!.nombre;
      const b = users.find((u) => u.id === s.jugador_b)!.nombre;
      log(`  ${a} vs ${b}  |  ${s.fecha}  ${s.franja}`);
    }
  }

  if (unmatched.length > 0) {
    log(`  Sin partido: ${unmatched.map((u) => u.nombre).join(", ")}`);
  } else {
    log("  Todos emparejados ✓");
  }
}

// ─── escenarios ─────────────────────────────────────────────────────────────

const [A, B, C, D, E, F] = ["A", "B", "C", "D", "E", "F"].map((id) =>
  user(id, id)
);

// Días de la semana del 8 al 14 de enero de 2024
const LUN = "2024-01-08";
const MAR = "2024-01-09";
const MIE = "2024-01-10";

// ── 1. Fallo clásico del greedy ──────────────────────────────────────────────
// A: lunes + martes  B: solo lunes  C: solo lunes  D: solo martes
// Greedy: empareja A+B el lunes → C y D quedan libres.
// Óptimo:  B+C el lunes, A+D el martes → todos juegan.
run(
  "Fallo del greedy (4 jugadores)",
  [A, B, C, D],
  [
    avail("A", LUN, "manana"), avail("A", MAR, "manana"),
    avail("B", LUN, "manana"),
    avail("C", LUN, "manana"),
    avail("D", MAR, "manana"),
  ]
);

// ── 2. Evitar repetir último rival ──────────────────────────────────────────
// A y B jugaron la semana pasada (último partido de A fue B y viceversa).
// A, B y C disponibles el lunes. Debe emparejar A+C o B+C, no A+B.
run(
  "Evitar repetir último rival",
  [A, B, C],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "manana"),
    avail("C", LUN, "manana"),
  ],
  [match("A", "B")] // A y B jugaron entre sí (son los últimos rivales mutuos)
);

// ── 3. Preferir pareja que nunca se ha enfrentado ────────────────────────────
// A jugó con B antes pero nunca con C. B jugó con A pero nunca con D.
// A, B, C, D disponibles el lunes. Debe preferir A+C y B+D.
run(
  "Preferir nunca enfrentados (tiebreaker)",
  [A, B, C, D],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "manana"),
    avail("C", LUN, "manana"),
    avail("D", LUN, "manana"),
  ],
  [
    match("A", "B", "2024-01-01"),
    match("A", "B", "2024-01-02"), // A y B se repiten, no son últimos entre sí aún
  ]
);

// ── 4. Número impar de jugadores ─────────────────────────────────────────────
// 5 jugadores disponibles: uno tiene que quedar fuera (el que tiene peor encaje).
run(
  "Número impar (5 jugadores)",
  [A, B, C, D, E],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "manana"),
    avail("C", LUN, "manana"),
    avail("D", LUN, "manana"),
    avail("E", LUN, "manana"),
  ]
);

// ── 5. Disponibilidades no coincidentes ──────────────────────────────────────
// A solo mañana, B solo tarde: no pueden jugar juntos.
// A y C coinciden en mañana; B y D coinciden en tarde.
run(
  "Franjas sin coincidencia forzada",
  [A, B, C, D],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "tarde"),
    avail("C", LUN, "manana"),
    avail("D", LUN, "tarde"),
  ]
);

// ── 6. Solo dos jugadores disponibles ────────────────────────────────────────
run(
  "Solo dos jugadores disponibles",
  [A, B, C, D],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "manana"),
    // C y D no tienen disponibilidad esta semana
  ]
);

// ── 7. Nadie disponible ───────────────────────────────────────────────────────
run(
  "Nadie disponible",
  [A, B, C],
  []
);

// ── 8. Máxima cobertura sobre tiebreakers ────────────────────────────────────
// A y B se enfrentaron la semana pasada (repetición, penalización).
// Sin embargo, la única forma de emparejar a C y D es pasando por A o B.
// El algoritmo debe preferir máxima cobertura aunque haya penalización.
run(
  "Máxima cobertura pese a penalización",
  [A, B, C, D],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "manana"),
    avail("C", LUN, "manana"), // C solo puede jugar con A o B
    avail("D", MIE, "manana"), // D solo puede jugar con A o B (miércoles)
  ],
  [match("A", "B")] // A y B son últimos rivales mutuos
);

// ── 9. Quien más partidas lleva se queda fuera ───────────────────────────────
// A: 0 partidas, B: 0 partidas, C: 10 partidas.
// Los 3 disponibles el lunes. Debe quedar fuera C.
const manyMatchesC = Array.from({ length: 10 }, (_, i) =>
  match("C", i % 2 === 0 ? "X" : "Y", `2023-0${(i % 9) + 1}-01`)
);
run(
  "Quien más partidas lleva se queda fuera (3 jugadores)",
  [A, B, C],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "manana"),
    avail("C", LUN, "manana"),
  ],
  manyMatchesC
);

// ── 10. Mismas partidas — desempate por nunca enfrentados ─────────────────────
// A: 5 partidas (con X), B: 5 partidas (con X), C: 5 partidas (con X).
// A y B nunca se han enfrentado. Debe emparejarse A+B, C queda fuera si el
// criterio de menor desventaja empuja a incluir a los que no se conocen.
const matchesAX = Array.from({ length: 5 }, (_, i) => match("A", "X", `2024-01-0${i + 1}`));
const matchesBX = Array.from({ length: 5 }, (_, i) => match("B", "X", `2024-02-0${i + 1}`));
const matchesCX = Array.from({ length: 5 }, (_, i) => match("C", "X", `2024-03-0${i + 1}`));
run(
  "Mismas partidas — desempate por nunca enfrentados",
  [A, B, C],
  [
    avail("A", LUN, "manana"),
    avail("B", LUN, "manana"),
    avail("C", LUN, "manana"),
  ],
  [...matchesAX, ...matchesBX, ...matchesCX]
);

log(`\n${"─".repeat(60)}\n`);

const out = lines.join("\n");
writeFileSync("test-matching-output.txt", out, "utf-8");
process.stdout.write(out + "\n");
