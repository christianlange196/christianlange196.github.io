import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import { mkdir, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const siteDir = path.join(rootDir, "_site");
const outputDir = path.join(rootDir, "dist");
const mode = (process.argv[2] || "all").toLowerCase();
const docs = mode === "all" ? ["resume", "cv"] : [mode];

if (!docs.every((doc) => ["resume", "cv"].includes(doc))) {
  console.error("Usage: node scripts/export-pdf.mjs [resume|cv|all]");
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf"
};

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: rootDir, stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(" ")} failed with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

function mapPathToFile(urlPath) {
  let safePath = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (safePath.endsWith("/")) {
    safePath += "index.html";
  }

  if (safePath === "") {
    safePath = "/index.html";
  }

  const absolutePath = path.normalize(path.join(siteDir, safePath));
  if (!absolutePath.startsWith(siteDir)) {
    return null;
  }

  return absolutePath;
}

function createStaticServer(port = 4173) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const filePath = mapPathToFile(req.url);
        if (!filePath) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }

        await access(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
        createReadStream(filePath).pipe(res);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not Found");
      }
    });

    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function exportPdfForDoc(browser, doc, baseUrl) {
  const page = await browser.newPage();
  const url = `${baseUrl}/${doc}/`;
  const fileNames = {
    resume: "resume_optical_engineer_v2.pdf",
    cv: "cv_full_v2.pdf"
  };
  const outPath = path.join(outputDir, fileNames[doc]);

  await page.goto(url, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in"
    }
  });

  await page.close();
  console.log(`Wrote ${outPath}`);
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  
  await runCommand("npm", ["run", "build"]);

  const server = await createStaticServer();
  const baseUrl = "http://127.0.0.1:4173";

  try {
    const browser = await chromium.launch({ headless: true });
    try {
      for (const doc of docs) {
        await exportPdfForDoc(browser, doc, baseUrl);
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});



