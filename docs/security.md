# Security — V0.4

V0.4 improves authentication and tenant security with Argon2id, short-lived access tokens, revocable sessions, RBAC, hashed API keys, rate limiting, Helmet and audit logs.

## Mandatory production actions

1. Use a real secret manager/KMS for integration secrets.
2. Put the crawler behind an outbound proxy and enforce SSRF checks before every request and redirect.
3. Add CSRF tokens if cookie-authenticated state-changing endpoints are exposed cross-site.
4. Add email verification, password reset and MFA.
5. Add tenant-isolation automated tests.
6. Encrypt sensitive contact fields where required.
7. Implement retention, deletion and suppression workflows.
8. Review discovery-provider terms and outreach laws before scaling.
9. Do not send marketing email merely because an address is public.
