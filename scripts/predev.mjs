import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createConnection } from "node:net";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "API_PORT",
  "WEB_ORIGIN",
];

function loadEnv() {
  const envPath = new URL("../.env", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
  if (!existsSync(envPath)) {
    console.error("\x1b[31m✖ .env file not found.\x1b[0m Copy .env.example → .env and fill in your values.");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

function checkEnvVars() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\x1b[31m✖ Missing environment variables:\x1b[0m ${missing.join(", ")}`);
    console.error("  Please check your .env file.");
    process.exit(1);
  }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const sock = createConnection({ port, host: "127.0.0.1" }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => resolve(false));
    sock.setTimeout(500, () => { sock.destroy(); resolve(false); });
  });
}

async function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
      const pids = [...new Set(out.split("\n").map((l) => l.trim().split(/\s+/).pop()).filter((p) => p && p !== "0"))];
      for (const pid of pids) {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: "pipe" }); } catch {}
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: "pipe" });
    }
  } catch {}
}

async function checkService(name, host, port) {
  const up = await checkPort(port);
  if (!up) {
    console.error(`\x1b[31m✖ ${name} is not running on ${host}:${port}\x1b[0m`);
    return false;
  }
  console.log(`\x1b[32m✓\x1b[0m ${name} is running on ${host}:${port}`);
  return true;
}

async function main() {
  console.log("\x1b[36m┌─────────────────────────────────────────┐\x1b[0m");
  console.log("\x1b[36m│   AI Prospecting OS v0.4 — Dev Setup    │\x1b[0m");
  console.log("\x1b[36m└─────────────────────────────────────────┘\x1b[0m\n");

  // 1. Load & check .env
  loadEnv();
  checkEnvVars();
  console.log("\x1b[32m✓\x1b[0m Environment variables loaded from .env\n");

  // 2. Parse connection info
  const dbUrl = new URL(process.env.DATABASE_URL);
  const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");
  const apiPort = parseInt(process.env.API_PORT || "4000");
  const webPort = parseInt(process.env.WEB_ORIGIN?.match(/:(\d+)/)?.[1] || "3000");

  // 3. Check PostgreSQL & Redis
  const pgOk = await checkService("PostgreSQL", dbUrl.hostname, parseInt(dbUrl.port || "5432"));
  const redisOk = await checkService("Redis", redisUrl.hostname, parseInt(redisUrl.port || "6379"));

  if (!pgOk || !redisOk) {
    console.error("\n\x1b[33m⚠ Please start the missing services before running 'pnpm dev'.\x1b[0m");
    console.error("  If using Laragon, open Laragon and click 'Start All'.");
    console.error("  Or start manually:");
    if (!pgOk) console.error("    pg_ctl start -D <data_dir> -l <logfile>");
    if (!redisOk) console.error("    redis-server");
    process.exit(1);
  }

  // 4. Kill stale processes on API & Web ports
  console.log("");
  const apiInUse = await checkPort(apiPort);
  if (apiInUse) {
    console.log(`\x1b[33m⚠\x1b[0m Port ${apiPort} in use, freeing...`);
    await killPort(apiPort);
    await new Promise((r) => setTimeout(r, 500));
  }
  const webInUse = await checkPort(webPort);
  if (webInUse) {
    console.log(`\x1b[33m⚠\x1b[0m Port ${webPort} in use, freeing...`);
    await killPort(webPort);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\x1b[32m✓\x1b[0m Ports ${apiPort} (API) and ${webPort} (Web) are available`);
  console.log("\n\x1b[32m✓ All checks passed. Starting services...\x1b[0m\n");
}

main();
