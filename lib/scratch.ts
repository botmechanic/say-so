import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

/**
 * The scratch workspace lives OUTSIDE the Next.js project so that files the
 * agent writes never trip the dev server's file watcher (which would reload
 * the demo page mid-build). Because of that, the pre-seeded screenshot script
 * resolves Playwright from this repo's node_modules via an absolute base path.
 */
const REPO_ROOT = process.cwd();

export const SCRATCH_ROOT = path.join(os.tmpdir(), "say-so");
/** The agent's working directory. It scaffolds the app here. */
export const WORKSPACE_DIR = path.join(SCRATCH_ROOT, "workspace");
/** Helper directory holding the screenshot script + its output (agent never edits it). */
export const PROOF_DIR = path.join(SCRATCH_ROOT, "proof");
export const PROOF_SCRIPT = path.join(PROOF_DIR, "screenshot.mjs");
export const PROOF_PATH = path.join(PROOF_DIR, "proof.png");

/**
 * Self-contained screenshot helper the agent runs as a single command:
 *   node screenshot.mjs <serveDir> <outPath>
 * It serves the directory on an ephemeral port, loads it in headless Chromium,
 * and writes a PNG. No agent-managed background server, so nothing can hang.
 */
function screenshotScript(): string {
  const requireBase = JSON.stringify(path.join(REPO_ROOT, "sayso-require-base.cjs"));
  return `import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(${requireBase});
const { chromium } = require("playwright");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

const serveDir = path.resolve(process.argv[2] || ".");
const out = path.resolve(process.argv[3] || "proof.png");

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const fp = path.join(serveDir, p);
    if (!fp.startsWith(serveDir)) {
      res.writeHead(403);
      return res.end("forbidden");
    }
    const data = await readFile(fp);
    res.writeHead(200, {
      "content-type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const url = "http://127.0.0.1:" + port + "/";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: out });
  console.log("Screenshot saved to " + out);
} finally {
  await browser.close();
  server.close();
}
`;
}

/** Wipe the workspace and (re)write the screenshot helper before each build. */
export async function resetScratch(): Promise<void> {
  await fs.rm(WORKSPACE_DIR, { recursive: true, force: true });
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  await fs.mkdir(PROOF_DIR, { recursive: true });
  await fs.rm(PROOF_PATH, { force: true });
  await fs.writeFile(PROOF_SCRIPT, screenshotScript(), "utf8");
}

export async function proofExists(): Promise<boolean> {
  try {
    const stat = await fs.stat(PROOF_PATH);
    return stat.size > 0;
  } catch {
    return false;
  }
}

export async function readProof(): Promise<Buffer> {
  return fs.readFile(PROOF_PATH);
}
