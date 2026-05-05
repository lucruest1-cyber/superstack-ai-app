// Run with: node scripts/generate-icons.cjs
const sharp = require("sharp");
const path  = require("path");
const OUT   = path.join(__dirname, "../client/public");

// ── SVG icon (192×192 base, scaled for each size) ────────────────────────────
// Design: dark rounded square • bold red dumbbell • green leaf sprout above grip
function buildSVG(size) {
  const s = size / 192;           // scale factor
  const rx = Math.round(42 * s);  // corner radius

  // helper: scale a value
  const sc = (v) => (v * s).toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg"
     width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${rx}" fill="#0a0a0f"/>

  <!-- ── Dumbbell (horizontal, centered at y≈96) ───────────────────────── -->

  <!-- Left outer weight plate -->
  <rect x="${sc(12)}" y="${sc(74)}" width="${sc(22)}" height="${sc(44)}"
        rx="${sc(6)}" fill="#ef4444"/>
  <!-- Left inner weight plate -->
  <rect x="${sc(16)}" y="${sc(79)}" width="${sc(14)}" height="${sc(34)}"
        rx="${sc(4)}" fill="#dc2626"/>

  <!-- Left bar -->
  <rect x="${sc(34)}" y="${sc(87)}" width="${sc(22)}" height="${sc(18)}"
        rx="${sc(4)}" fill="#f87171"/>

  <!-- Centre grip -->
  <rect x="${sc(56)}" y="${sc(78)}" width="${sc(80)}" height="${sc(36)}"
        rx="${sc(9)}" fill="#ef4444"/>
  <!-- Grip knurl highlight -->
  <rect x="${sc(68)}" y="${sc(84)}" width="${sc(56)}" height="${sc(12)}"
        rx="${sc(4)}" fill="#dc2626" opacity="0.6"/>

  <!-- Right bar -->
  <rect x="${sc(136)}" y="${sc(87)}" width="${sc(22)}" height="${sc(18)}"
        rx="${sc(4)}" fill="#f87171"/>

  <!-- Right inner weight plate -->
  <rect x="${sc(162)}" y="${sc(79)}" width="${sc(14)}" height="${sc(34)}"
        rx="${sc(4)}" fill="#dc2626"/>
  <!-- Right outer weight plate -->
  <rect x="${sc(158)}" y="${sc(74)}" width="${sc(22)}" height="${sc(44)}"
        rx="${sc(6)}" fill="#ef4444"/>

  <!-- ── Green leaf / sprout above grip centre ─────────────────────────── -->

  <!-- Left leaf lobe -->
  <path d="
    M ${sc(96)} ${sc(72)}
    C ${sc(88)} ${sc(52)}, ${sc(68)} ${sc(50)}, ${sc(72)} ${sc(36)}
    C ${sc(80)} ${sc(22)}, ${sc(92)} ${sc(30)}, ${sc(96)} ${sc(48)}
    Z"
    fill="#22c55e"/>

  <!-- Right leaf lobe -->
  <path d="
    M ${sc(96)} ${sc(72)}
    C ${sc(104)} ${sc(52)}, ${sc(124)} ${sc(50)}, ${sc(120)} ${sc(36)}
    C ${sc(112)} ${sc(22)}, ${sc(100)} ${sc(30)}, ${sc(96)} ${sc(48)}
    Z"
    fill="#16a34a"/>

  <!-- Stem (centre vein) -->
  <line x1="${sc(96)}" y1="${sc(72)}" x2="${sc(96)}" y2="${sc(36)}"
        stroke="#15803d" stroke-width="${sc(2.5)}" stroke-linecap="round"/>

  <!-- Small stem into grip -->
  <line x1="${sc(96)}" y1="${sc(78)}" x2="${sc(96)}" y2="${sc(72)}"
        stroke="#22c55e" stroke-width="${sc(2.5)}" stroke-linecap="round"/>
</svg>`;
}

async function generate(size) {
  const svg = Buffer.from(buildSVG(size));
  const dest = path.join(OUT, `icon-${size}.png`);
  await sharp(svg).png().toFile(dest);
  console.log(`✅  icon-${size}.png`);
}

(async () => {
  await generate(192);
  await generate(512);
})();
