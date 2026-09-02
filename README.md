# AI Prospecting OS V0.4

A production-oriented multi-tenant prospecting SaaS foundation.

## Pipeline
Discovery → normalization → dedup → website enrichment → public contacts → evidence → opportunities → AI research → scoring → CRM-ready handoff.

## V0.4 highlights
- Argon2id passwords
- revocable persistent sessions
- HttpOnly/Secure/SameSite session cookie
- RBAC + team invitations
- campaign scheduling foundation
- suppression list
- billing/subscription primitives
- webhook delivery records
- API keys
- audit log
- provider registry
- SSRF validation helper
- Redis/BullMQ workers and retries
- PostgreSQL/Prisma
- Next.js/Fastify
- Docker Compose

## Quick start
```bash
cp .env.example .env
docker compose up --build
```
Web: http://localhost:3000
API: http://localhost:4000/api/health
Demo: owner@example.com / ChangeMe123!

## Local
```bash
corepack enable
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Validation
```bash
pnpm validate
```

See docs/V0.4.md, docs/security.md and docs/production-checklist.md.
