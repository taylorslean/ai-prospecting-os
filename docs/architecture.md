# Architecture
```text
Next.js Web
    │
 Fastify API ───── PostgreSQL
    │
   Redis
    │
 BullMQ Worker
    ├─ Discovery
    ├─ Crawl
    ├─ Contacts
    ├─ Evidence/opportunities
    ├─ AI research
    └─ Scoring
```
All primary tenant entities carry organizationId. API membership lookup is the authorization boundary; worker jobs carry tenant IDs and should re-check ownership for every sensitive operation in a hardened deployment.
