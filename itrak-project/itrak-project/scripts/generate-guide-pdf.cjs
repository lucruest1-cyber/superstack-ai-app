// Run with: node scripts/generate-guide-pdf.cjs
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "../client/public/itrak-add-to-home-screen-guide.pdf");

const doc = new PDFDocument({ size: "A4", margin: 52 });
doc.pipe(fs.createWriteStream(OUT));

// ── Colours ────────────────────────────────────────────────────────────────────
const BLACK   = "#0a0a0f";
const WHITE   = "#ffffff";
const BLUE    = "#3b82f6";
const GRAY    = "#6b7280";
const LIGHT   = "#f3f4f6";
const STEP_BG = "#eff6ff";

const W = doc.page.width - 104; // usable width

// ── Header band ────────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 110).fill(BLACK);
doc.fill(WHITE).fontSize(32).font("Helvetica-Bold")
   .text("I-TRAK", 52, 28, { align: "left" });
doc.fill(BLUE).fontSize(13).font("Helvetica")
   .text("Add to Your Home Screen", 52, 68, { align: "left" });

let y = 130;

// ── Subtitle ───────────────────────────────────────────────────────────────────
doc.fill(GRAY).fontSize(11).font("Helvetica")
   .text("Follow these 5 steps to install I-TRAK on your iPhone like a native app.", 52, y, { width: W });
y += 38;

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "1",
    icon: "🧭",
    title: "Open Safari",
    body: "On your iPhone, open Safari and navigate to:\nhttps://superstack-ai-app.vercel.app/",
  },
  {
    num: "2",
    icon: "⬆️",
    title: "Tap the Share Button",
    body: "Tap the Share icon at the bottom of the Safari screen (the box with an arrow pointing up).",
  },
  {
    num: "3",
    icon: "➕",
    title: 'Tap "Add to Home Screen"',
    body: 'Scroll down in the Share menu and tap "Add to Home Screen".',
  },
  {
    num: "4",
    icon: "✅",
    title: "Confirm the App Name",
    body: 'The name will say "I-TRAK". Tap "Add" in the top-right corner.',
  },
  {
    num: "5",
    icon: "🚀",
    title: "Launch I-TRAK",
    body: "Tap the I-TRAK icon on your home screen to open the app in full-screen mode.",
  },
];

for (const step of STEPS) {
  const cardH = 82;

  // Card background
  doc.roundedRect(52, y, W, cardH, 10).fill(STEP_BG);

  // Number circle
  doc.circle(84, y + 41, 18).fill(BLUE);
  doc.fill(WHITE).fontSize(16).font("Helvetica-Bold")
     .text(step.num, 76, y + 32, { width: 16, align: "center" });

  // Title
  doc.fill(BLACK).fontSize(14).font("Helvetica-Bold")
     .text(`${step.icon}  ${step.title}`, 114, y + 12, { width: W - 70 });

  // Body
  doc.fill(GRAY).fontSize(10.5).font("Helvetica")
     .text(step.body, 114, y + 34, { width: W - 70, lineGap: 2 });

  y += cardH + 12;
}

// ── Tip box ────────────────────────────────────────────────────────────────────
y += 6;
doc.roundedRect(52, y, W, 64, 10).fill(LIGHT);
doc.fill(BLUE).fontSize(11).font("Helvetica-Bold")
   .text("💡  Tip", 72, y + 12);
doc.fill(GRAY).fontSize(10).font("Helvetica")
   .text(
     "I-TRAK works offline once installed and syncs your data automatically when you reconnect. Sign in with Google to keep your workouts and meals in sync across devices.",
     72, y + 30, { width: W - 38, lineGap: 2 }
   );
y += 80;

// ── Footer ─────────────────────────────────────────────────────────────────────
doc.fill(GRAY).fontSize(9).font("Helvetica")
   .text("I-TRAK Fitness Tracker  ·  superstack-ai-app.vercel.app", 52, y, {
     width: W, align: "center",
   });

doc.end();
console.log("✅  PDF written to", OUT);
