// scripts/test-flow.mjs — E2E test: create campaigns, leads, scores, opportunities
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
function loadEnv() {
  for (const line of readFileSync(resolve(ROOT, ".env"), "utf-8").split("\n")) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("="); if (i === -1) continue;
    if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}
loadEnv();

const API = `http://localhost:${process.env.API_PORT || 4009}`;
let TOKEN = "";

async function api(method, path, body) {
  const h = { "Content-Type": "application/json" };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  const r = await fetch(`${API}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = t; }
  return { status: r.status, data: d };
}
function ok(label, res, expect = 200) {
  const pass = res.status === expect;
  console.log(`  ${pass ? "\x1b[32m✓" : "\x1b[31m✖"}\x1b[0m ${label} [${res.status}]`);
  if (!pass) console.log("    →", JSON.stringify(res.data).slice(0, 200));
  return pass;
}

async function main() {
  console.log("\x1b[36m");
  console.log("  ╔═══════════════════════════════════════════╗");
  console.log("  ║   AI Prospecting OS — End-to-End Test     ║");
  console.log("  ╚═══════════════════════════════════════════╝");
  console.log("\x1b[0m");

  // ─── 1. Health ────────────────────────────────────────────
  console.log("  \x1b[36m── Health ──\x1b[0m");
  ok("GET /api/health", await api("GET", "/api/health"));

  // ─── 2. Login ─────────────────────────────────────────────
  console.log("\n  \x1b[36m── Auth ──\x1b[0m");
  const login = await api("POST", "/api/auth/login", { email: "owner@example.com", password: "ChangeMe123!" });
  ok("POST /api/auth/login", login);
  TOKEN = login.data.token;

  // ─── 3. Create Campaigns ─────────────────────────────────
  console.log("\n  \x1b[36m── Campaigns ──\x1b[0m");
  const c1 = await api("POST", "/api/campaigns", { name: "Jakarta Dental Clinics", query: "dental clinic", location: "Jakarta, Indonesia", offer: "Website redesign + AI booking system", maxResults: 50 });
  ok("POST /api/campaigns (Jakarta Dental)", c1);
  const c1Id = c1.data?.id;

  const c2 = await api("POST", "/api/campaigns", { name: "Bali Restaurant Marketing", query: "restaurant", location: "Bali, Indonesia", offer: "Social media management + Google Ads", maxResults: 30 });
  ok("POST /api/campaigns (Bali Restaurant)", c2);

  const campaigns = await api("GET", "/api/campaigns");
  ok("GET /api/campaigns", campaigns);
  console.log(`    → ${campaigns.data?.length || 0} campaigns`);

  // ─── 4. Insert test data via Prisma ───────────────────────
  console.log("\n  \x1b[36m── Populating test data ──\x1b[0m");

  // Dynamic import from packages/db using relative path
  const { PrismaClient } = await import(`file:///${ROOT.replace(/\\/g, "/")}/node_modules/.pnpm/@prisma+client@6.19.3_prism_1d040ab5215f59f0e27ddee7f0cf082e/node_modules/@prisma/client/default.js`).catch(async () => {
    // Fallback: find the prisma client
    const { execSync } = await import("node:child_process");
    const p = execSync("node -e \"console.log(require.resolve('@prisma/client'))\"", { encoding: "utf-8", cwd: resolve(ROOT, "apps/api") }).trim();
    return import(`file:///${p.replace(/\\/g, "/")}`);
  });
  const db = new PrismaClient();
  const orgId = "demo-org";

  const businesses = [
    { name: "Klinik Gigi Sehat Sempurna", domain: "klinikgigisehat.co.id", category: "Dental Clinic", phone: "+62-21-5550101", rating: 4.8, reviews: 245, website: "https://klinikgigisehat.co.id", status: "QUALIFIED", addr: "Jl. Sudirman No. 12, Jakarta Pusat" },
    { name: "Jakarta Smile Dental Care", domain: "jakartasmile.com", category: "Dental Clinic", phone: "+62-21-5550202", rating: 4.6, reviews: 182, website: "https://jakartasmile.com", status: "CONTACTED", addr: "Jl. Gatot Subroto No. 45, Jakarta Selatan" },
    { name: "Bright Teeth Dental Studio", domain: "brightteeth.id", category: "Dental Clinic", phone: "+62-21-5550303", rating: 4.9, reviews: 310, website: "https://brightteeth.id", status: "QUALIFIED", addr: "Jl. Thamrin No. 8, Jakarta Pusat" },
    { name: "Dental Excellence Jakarta", domain: "dentalexcellence.co.id", category: "Dental Clinic", phone: "+62-21-5550404", rating: 4.3, reviews: 95, website: "https://dentalexcellence.co.id", status: "NEW", addr: "Jl. Rasuna Said No. 22, Jakarta Selatan" },
    { name: "Senyum Indah Dental Clinic", domain: "senyumindah.com", category: "Dental Clinic", phone: "+62-21-5550505", rating: 4.7, reviews: 156, website: "https://senyumindah.com", status: "REPLIED", addr: "Jl. Kuningan No. 5, Jakarta Selatan" },
    { name: "Happy Dental Family Care", domain: "happydental.id", category: "Dental Clinic", phone: "+62-21-5550606", rating: 4.1, reviews: 67, website: "https://happydental.id", status: "NEW", addr: "Jl. Kemang No. 15, Jakarta Selatan" },
    { name: "ProDent Clinic Sudirman", domain: "prodent.co.id", category: "Dental Clinic", phone: "+62-21-5550707", rating: 4.5, reviews: 203, website: "https://prodent.co.id", status: "WON", addr: "Jl. Sudirman No. 88, Jakarta Pusat" },
    { name: "Mitra Dental Clinic", domain: "mitradental.com", category: "Dental Clinic", phone: "+62-21-5550808", rating: 3.9, reviews: 45, website: "https://mitradental.com", status: "NEW", addr: "Jl. Wahid Hasyim No. 33, Jakarta Pusat" },
  ];

  const contactNames = ["Dr. Andi Pratama", "Dr. Budi Santoso", "Dr. Citra Dewi", "Dr. Dewi Lestari", "Dr. Eka Prasetya", "Dr. Fitri Handayani", "Dr. Gilang Ramadhan", "Dr. Hana Safitri"];
  const contactTitles = ["Owner & Lead Dentist", "Head of Practice", "Practice Manager", "Marketing Director", "Clinical Director", "Operations Manager", "Senior Dentist", "Business Development"];

  let insertedCount = 0;
  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    const bizId = crypto.randomUUID();
    try {
      await db.business.create({
        data: {
          id: bizId, organizationId: orgId, name: biz.name,
          normalizedName: biz.name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim(),
          domain: biz.domain, category: biz.category, phone: biz.phone,
          website: biz.website, address: biz.addr, rating: biz.rating,
          reviews: biz.reviews, source: "google_maps",
          sourceUrl: `https://maps.google.com/?q=${encodeURIComponent(biz.name)}`,
          status: biz.status,
        },
      });

      // Contact
      await db.contact.create({
        data: {
          id: crypto.randomUUID(), businessId: bizId, name: contactNames[i],
          title: contactTitles[i], email: `contact@${biz.domain}`, phone: biz.phone,
          confidence: 0.85 + Math.random() * 0.15,
        },
      });

      // Lead score
      const score = [92, 78, 95, 55, 82, 45, 88, 38][i];
      await db.leadScore.create({
        data: {
          id: crypto.randomUUID(), businessId: bizId, score,
          reasons: [
            score > 80 ? "High review count with excellent rating" : score > 60 ? "Moderate online presence" : "Limited web presence",
            score > 70 ? "Decision maker identified and reachable" : "Contact information found",
            score > 80 ? "Website shows clear growth potential" : score > 60 ? "Basic website present" : "No website or outdated design",
          ],
        },
      });

      // Opportunities for leads with score > 50
      if (score > 50) {
        const allOpps = [
          { type: "website_redesign", title: "Website Needs Modernization", desc: `${biz.name}'s website lacks mobile responsiveness and modern booking features` },
          { type: "seo", title: "Local SEO Opportunity", desc: `Low visibility despite ${biz.reviews} reviews — targeted SEO could boost patient acquisition by 30%` },
          { type: "ai_integration", title: "AI Booking System", desc: "No online appointment system detected — AI chatbot could increase bookings by 40%" },
        ];
        const numOpps = score > 85 ? 3 : score > 70 ? 2 : 1;
        for (let j = 0; j < numOpps; j++) {
          await db.opportunity.create({
            data: {
              id: crypto.randomUUID(), businessId: bizId,
              type: allOpps[j].type, title: allOpps[j].title,
              description: allOpps[j].desc,
              status: biz.status === "WON" ? "CONVERTED" : "OPEN",
              confidence: 0.6 + Math.random() * 0.35,
            },
          });
        }
      }
      insertedCount++;
    } catch (e) {
      if (e.code === "P2002") console.log(`    ⊘ ${biz.name} (exists, skipping)`);
      else console.log(`    \x1b[31m✖\x1b[0m ${biz.name}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`  \x1b[32m✓\x1b[0m ${insertedCount} businesses + contacts + scores + opportunities`);

  // Usage events
  let usageInserted = 0;
  for (let i = 0; i < 23; i++) {
    try {
      await db.usageEvent.create({
        data: {
          id: crypto.randomUUID(), organizationId: orgId,
          kind: ["api_call", "lead_research", "campaign_crawl", "email_enrichment", "csv_export"][i % 5],
          units: Math.floor(1 + Math.random() * 8),
          createdAt: new Date(Date.now() - Math.random() * 7 * 86400000),
        },
      });
      usageInserted++;
    } catch {}
  }
  console.log(`  \x1b[32m✓\x1b[0m ${usageInserted} usage events`);

  // Update campaign status
  if (c1Id) {
    await db.campaign.update({ where: { id: c1Id }, data: { status: "RUNNING" } }).catch(() => {});
  }
  if (c2.data?.id) {
    await db.campaign.update({ where: { id: c2.data.id }, data: { status: "COMPLETED" } }).catch(() => {});
  }
  console.log(`  \x1b[32m✓\x1b[0m Campaign statuses updated`);

  await db.$disconnect();

  // ─── 5. Verify API ───────────────────────────────────────
  console.log("\n  \x1b[36m── API Endpoints ──\x1b[0m");

  const leads = await api("GET", "/api/leads");
  ok("GET /api/leads", leads);
  const totalLeads = leads.data?.length || 0;
  const highIntent = leads.data?.filter(l => l.leadScore?.score >= 70)?.length || 0;
  const totalOpps = leads.data?.reduce((s, l) => s + (l.opportunities?.length || 0), 0) || 0;
  console.log(`    → ${totalLeads} leads, ${highIntent} high intent, ${totalOpps} opportunities`);

  if (leads.data?.[0]) {
    ok("GET /api/leads/:id", await api("GET", `/api/leads/${leads.data[0].id}`));
    ok("PATCH /api/leads/:id/status", await api("PATCH", `/api/leads/${leads.data[0].id}/status`, { status: "CONTACTED" }));
  }

  ok("GET /api/usage", await api("GET", "/api/usage"));
  ok("GET /api/leads/export.csv", await api("GET", "/api/leads/export.csv"));
  ok("POST /api/api-keys", await api("POST", "/api/api-keys", { name: "Test Key" }));
  ok("GET /api/api-keys", await api("GET", "/api/api-keys"));
  ok("GET /api/audit-logs", await api("GET", "/api/audit-logs"));
  ok("GET /api/team/members", await api("GET", "/api/team/members"));
  ok("GET /api/providers", await api("GET", "/api/providers"));
  ok("GET /api/billing/subscription", await api("GET", "/api/billing/subscription"));

  // ─── Summary ──────────────────────────────────────────────
  const usage = await api("GET", "/api/usage");
  console.log("\n\x1b[36m  ╔═══════════════════════════════════════════╗");
  console.log("  ║           ✓ Test Summary                  ║");
  console.log("  ╚═══════════════════════════════════════════╝\x1b[0m\n");
  console.log(`  Campaigns:     ${campaigns.data?.length || 0}`);
  console.log(`  Total Leads:   ${totalLeads}`);
  console.log(`  High Intent:   ${highIntent} (score ≥ 70)`);
  console.log(`  Opportunities: ${totalOpps}`);
  console.log(`  Usage:         ${usage.data?.used || 0} / ${usage.data?.limit || 0} (${usage.data?.plan || "N/A"})`);
  console.log("");
  console.log("  \x1b[32m→ Refresh http://localhost:3009 to see the dashboard!\x1b[0m\n");
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
