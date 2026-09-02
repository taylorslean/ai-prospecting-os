// scripts/dev.mjs — Dev orchestrator
import { existsSync, readFileSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { createConnection } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── .env loader ────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) {
    console.error("  \x1b[31m✖ .env not found.\x1b[0m Copy .env.example → .env");
    process.exit(1);
  }
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

// ─── Port helpers ───────────────────────────────────────────────
function checkPort(port) {
  return new Promise((resolve) => {
    const s = createConnection({ port, host: "127.0.0.1" }, () => { s.destroy(); resolve(true); });
    s.on("error", () => resolve(false));
    s.setTimeout(500, () => { s.destroy(); resolve(false); });
  });
}

async function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
      const pids = [...new Set(out.split("\n").map((l) => l.trim().split(/\s+/).pop()).filter((p) => p && p !== "0"))];
      for (const p of pids) try { execSync(`taskkill /PID ${p} /F`, { stdio: "pipe" }); } catch {}
    }
  } catch {}
}

// ─── Pre-flight checks ─────────────────────────────────────────
async function preflight() {
  console.log("\x1b[36m");
  console.log("  ╔═══════════════════════════════════════════╗");
  console.log("  ║    AI Prospecting OS v0.4 — Dev Server    ║");
  console.log("  ╚═══════════════════════════════════════════╝");
  console.log("\x1b[0m");

  const required = ["DATABASE_URL", "REDIS_URL", "JWT_SECRET", "API_PORT", "WEB_ORIGIN"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`  \x1b[31m✖\x1b[0m Missing: ${missing.join(", ")}\n    Check your .env file.`);
    process.exit(1);
  }
  console.log("  \x1b[32m✓\x1b[0m Environment loaded (.env)");

  const dbUrl = new URL(process.env.DATABASE_URL);
  const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");
  const dbPort = parseInt(dbUrl.port || "5432");
  const redisPort = parseInt(redisUrl.port || "6379");

  const pgOk = await checkPort(dbPort);
  const redisOk = await checkPort(redisPort);

  console.log(pgOk ? `  \x1b[32m✓\x1b[0m PostgreSQL (${dbUrl.hostname}:${dbPort})` : `  \x1b[31m✖\x1b[0m PostgreSQL not running on port ${dbPort}`);
  console.log(redisOk ? `  \x1b[32m✓\x1b[0m Redis (${redisUrl.hostname}:${redisPort})` : `  \x1b[31m✖\x1b[0m Redis not running on port ${redisPort}`);

  if (!pgOk || !redisOk) {
    console.error("\n  \x1b[33mStart missing services and try again.\x1b[0m\n");
    process.exit(1);
  }

  const apiPort = parseInt(process.env.API_PORT || "4000");
  const webPort = parseInt(process.env.WEB_ORIGIN?.match(/:(\d+)/)?.[1] || "3000");

  for (const port of [apiPort, webPort]) {
    if (await checkPort(port)) { await killPort(port); await new Promise((r) => setTimeout(r, 300)); }
  }
  console.log(`  \x1b[32m✓\x1b[0m Ports ${apiPort} (API) · ${webPort} (Web)`);
  console.log("\n  \x1b[36m→ Starting services...\x1b[0m\n");
}

// ─── Start ──────────────────────────────────────────────────────
async function start() {
  loadEnv();
  await preflight();

  const cmd = [
    "npx concurrently -k",
    '-n "api,worker,web"',
    '-c "blue,magenta,green"',
    '"pnpm --filter @prospecting/api dev"',
    '"pnpm --filter @prospecting/worker dev"',
    '"pnpm --filter @prospecting/web dev"',
  ].join(" ");

  const child = spawn(cmd, [], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => { child.kill(sig); });
  }
}

start();
