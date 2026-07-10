import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "faviconSevilla.png"
);
const outputIconPath = path.join(__dirname, "..", "src", "app", "icon.png");
const outputFaviconPath = path.join(__dirname, "..", "src", "app", "favicon.ico");
const backupPath = `${sourcePath}.bak`;

const BLACK_THRESHOLD = 24;
const FEATHER = 18;

function removeBlackBackground(data) {
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

  return data;
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error("No se encontró", sourcePath);
    process.exit(1);
  }

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(sourcePath, backupPath);
    console.log("Copia de seguridad:", backupPath);
  }

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  removeBlackBackground(data);

  const transparent = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(transparent)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outputIconPath);

  await sharp(transparent)
    .resize(48, 48, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(outputFaviconPath);

  await sharp(transparent).png({ compressionLevel: 9 }).toFile(sourcePath);

  console.log(
    `Favicon procesado: ${info.width}x${info.height} → fondo negro eliminado`
  );
  console.log("Icono de app:", outputIconPath, "(512x512)");
  console.log("Favicon ICO:", outputFaviconPath, "(48x48)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
