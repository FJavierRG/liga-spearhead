import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, "..", "public", "assets", "logoshsevilla.png");
const backupPath = `${logoPath}.bak`;

/** Umbral para tratar un píxel como negro de fondo (no el verde oscuro del logo). */
const BLACK_THRESHOLD = 24;
const FEATHER = 18;

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error("No se encontró", logoPath);
    process.exit(1);
  }

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(logoPath, backupPath);
    console.log("Copia de seguridad:", backupPath);
  }

  const { data, info } = await sharp(logoPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxChannel = Math.max(r, g, b);

    if (maxChannel <= BLACK_THRESHOLD) {
      data[i + 3] = 0;
      continue;
    }

    if (maxChannel <= BLACK_THRESHOLD + FEATHER) {
      const alpha = Math.round(
        ((maxChannel - BLACK_THRESHOLD) / FEATHER) * 255
      );
      data[i + 3] = Math.min(255, alpha);
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(logoPath);

  console.log(`Logo procesado: ${info.width}x${info.height} → fondo negro eliminado`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
