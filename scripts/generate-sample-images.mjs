// One-off generator for seed post featured images (gradient art → WebP).
import sharp from "sharp";
import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "data", "uploads");
fs.mkdirSync(outDir, { recursive: true });

const palettes = [
  ["#7c3aed", "#22d3ee", "AI"],
  ["#ec4899", "#8b5cf6", "DS"],
  ["#06b6d4", "#3b82f6", "CWV"],
  ["#f59e0b", "#ef4444", "GO"],
  ["#10b981", "#0ea5e9", "UI"],
  ["#a855f7", "#f43f5e", "SEO"],
];

for (let i = 0; i < palettes.length; i++) {
  const [from, to, label] = palettes[i];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1280" height="720" fill="#05060f"/>
    <rect width="1280" height="720" fill="url(#g)" opacity="0.85"/>
    <rect width="1280" height="720" fill="url(#grid)"/>
    <circle cx="${240 + i * 160}" cy="${180 + (i % 3) * 120}" r="220" fill="rgba(255,255,255,0.14)"/>
    <circle cx="${900 - i * 60}" cy="${520 - (i % 2) * 180}" r="150" fill="rgba(0,0,0,0.25)"/>
    <text x="640" y="400" font-family="Helvetica, Arial, sans-serif" font-size="220" font-weight="bold"
      fill="rgba(255,255,255,0.9)" text-anchor="middle">${label}</text>
  </svg>`;
  const out = path.join(outDir, `sample-${i + 1}.webp`);
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(out);
  console.log("wrote", out);
}
