export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduleTicker } = await import("@/lib/league/schedule-runner");
    startScheduleTicker();
  }
}
