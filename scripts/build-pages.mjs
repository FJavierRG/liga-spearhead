import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const middlewarePath = path.join(root, "src", "middleware.ts");
const middlewareBackup = `${middlewarePath}.pages-bak`;
const apiDir = path.join(root, "src", "app", "api");
const authCallback = path.join(root, "src", "app", "auth");
const buildBackupRoot = path.join(root, ".pages-build-bak");
const apiBackup = path.join(buildBackupRoot, "api");
const authBackup = path.join(buildBackupRoot, "auth");
const extraRoutesBackup = path.join(buildBackupRoot, "routes");
const extraRoutes = [
  path.join(root, "src", "app", "(main)", "perfil"),
  path.join(root, "src", "app", "(main)", "disponibilidad"),
  path.join(root, "src", "app", "(main)", "partidas"),
  path.join(root, "src", "app", "(main)", "clasificacion"),
];

process.env.NEXT_PUBLIC_STATIC_DEMO = "true";
process.env.NEXT_PUBLIC_MOCK_MODE = "true";
process.env.MOCK_MODE = "true";

if (!process.env.NEXT_PUBLIC_BASE_PATH) {
  console.warn(
    "NEXT_PUBLIC_BASE_PATH no definido; la demo se publicará en la raíz del dominio."
  );
}

const backups = [];

function backupPath(from, to) {
  if (!fs.existsSync(from)) return;
  if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  fs.rmSync(from, { recursive: true, force: true });
  backups.push({ from: to, to: from });
}

let restored = false;
function restoreAll() {
  if (restored) return;
  restored = true;
  for (const { from, to } of backups.reverse()) {
    if (fs.existsSync(from)) {
      if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true });
      fs.cpSync(from, to, { recursive: true });
      fs.rmSync(from, { recursive: true, force: true });
    }
  }
  backups.length = 0;
  if (fs.existsSync(middlewareBackup)) {
    fs.renameSync(middlewareBackup, middlewarePath);
  }
  if (fs.existsSync(buildBackupRoot)) {
    fs.rmSync(buildBackupRoot, { recursive: true, force: true });
  }
}

process.on("SIGINT", () => {
  restoreAll();
  process.exit(1);
});

console.log("Preparando build estático para GitHub Pages…");

if (fs.existsSync(middlewarePath)) {
  fs.renameSync(middlewarePath, middlewareBackup);
}
backupPath(apiDir, apiBackup);
backupPath(authCallback, authBackup);
if (fs.existsSync(extraRoutesBackup)) {
  fs.rmSync(extraRoutesBackup, { recursive: true, force: true });
}
fs.mkdirSync(extraRoutesBackup, { recursive: true });
for (const routePath of extraRoutes) {
  const name = path.basename(routePath);
  backupPath(routePath, path.join(extraRoutesBackup, name));
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

const outDir = path.join(root, "out");
if (result.status === 0 && fs.existsSync(outDir)) {
  fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
}

restoreAll();
process.exit(result.status ?? 1);
