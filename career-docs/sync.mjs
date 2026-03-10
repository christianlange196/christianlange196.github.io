import { mkdir, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const mappings = [
  ["career-docs/careerDocs.json", "_data/careerDocs.json"],
  ["career-docs/career-doc-content.html", "_includes/career-doc-content.html"],
  ["career-docs/document.html", "_layouts/document.html"],
  ["career-docs/career-docs.css", "assets/css/career-docs.css"],
  ["career-docs/resume.liquid", "pages/resume.liquid"],
  ["career-docs/cv.liquid", "pages/cv.liquid"],
  ["career-docs/export-pdf.mjs", "scripts/export-pdf.mjs"]
];

for (const [from, to] of mappings) {
  const src = path.join(root, from);
  const dst = path.join(root, to);
  await mkdir(path.dirname(dst), { recursive: true });
  await cp(src, dst, { force: true });
}

console.log("Synced career docs sources to Eleventy paths.");
