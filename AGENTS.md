<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Liga Spearhead — notas para agentes

- **Producción:** Railway (app Next.js). **Datos/auth:** Supabase. No desplegar ni documentar Vercel como hosting.
- **Emparejamientos:** automáticos desde `src/lib/league/schedule-runner.ts`; no requiere cron en Railway. Ver `docs/EMPAREJAMIENTOS.md`.
- **Variables críticas en producción:** `SUPABASE_SERVICE_ROLE_KEY` (emparejamientos), más las públicas de Supabase.

