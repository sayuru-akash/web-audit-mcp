# Production Deployment Guide

Web Audit v1 is a page-audit product with selected website health checks. Keep production copy, routes, and operator runbooks honest about that boundary. It is not a full-site crawler, penetration testing product, keyword tracker, or deep vulnerability scanner.

## Current Runtime Shape

- App runtime: Next.js App Router.
- Persistence today: local JSON at `data/webaudit.json`.
- Audit execution: the web app and MCP server call the shared audit service and audit engine.
- Queued/scheduled work: `npm run worker:once -- 5` or `POST /api/cron/run-scheduled`.
- MCP transport: local stdio through `npm run mcp`.
- Database libraries present: `drizzle-orm` and `@neondatabase/serverless`.
- Database runtime status: Postgres/Drizzle schema and initial SQL migration exist, but JSON is still the current runtime store.

## Required Production Environment

| Variable | Required | Production value |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Exact HTTPS app origin. Do not use localhost. |
| `CRON_SECRET` | Yes | Strong random secret used as `Authorization: Bearer <secret>`. |
| `ADMIN_EMAILS` | Yes | Comma-separated operator email allowlist. |
| `WEB_AUDIT_DEV_RESET_TOKENS` | Yes | `false`. |
| `DATABASE_URL` | No | Leave unset until the Postgres runtime adapter is enabled. |

## Local JSON Storage Limits

The JSON store is acceptable for development, demos, and controlled single-node self-hosting. It is not enough for horizontally scaled production.

Current limits:

- `src/lib/store.ts` serializes writes only inside one Node.js process.
- Multiple web instances, serverless instances, or worker processes can overwrite each other.
- Rate limits live in the same JSON file and are not distributed.
- There is no schema migration history, row-level locking, transaction isolation, PITR, or managed backup.
- The file contains private operational data: users, hashed passwords, session token hashes, websites, audits, findings, metrics, notifications, share links, reset token hashes, and rate-limit counters.

If you use JSON in a private single-node deployment:

- Mount `data/` on persistent private storage.
- Run only one process that writes to `data/webaudit.json`.
- Back up `data/` on a schedule.
- Test restore before relying on the backup.
- Keep file permissions restricted to the app user.

## Optional Postgres/Drizzle Path

Postgres/Drizzle is the intended production persistence direction. The schema and initial SQL migration are present, but the app still needs a runtime store adapter before it can use Postgres for live data.

Do not treat `DATABASE_URL` as active until these are complete:

- Store adapter replacing JSON reads/writes without changing product behavior.
- Unique constraints for user emails, session token hashes, share tokens, and per-user website URLs.
- Transactional audit completion that writes run status, findings, metrics, latest website summary, and notifications atomically.
- Shared rate-limit storage.
- Seed or fixture data for local tests.
- Backup, restore, and migration rollback procedure.
- Parity tests for signup/login, password reset token flow, website CRUD, manual audits, scheduled audits, PDF export, share links, admin health, and MCP persistence.

For hosted Postgres such as Neon:

- Use a pooled connection string where the deployment platform requires pooling.
- Keep migration execution explicit, not hidden in app startup.
- Enable backups and test restore into a staging database.
- Confirm all audit paths keep SSRF protections in code even after worker/database changes.

## Admin, Cron, And Security Controls

Keep these controls active in every production path:

- `/admin` and `GET /api/admin/health` require `ADMIN_EMAILS` outside development.
- `POST /api/cron/run-scheduled` requires `CRON_SECRET` outside development.
- Cron calls must include `Authorization: Bearer <CRON_SECRET>`.
- `GET /api/health` stays public and low-detail.
- Public `POST /api/audit-url` is rate limited by forwarded IP.
- Per-user website creation and audit execution are rate limited.
- URL validation allows only HTTP/HTTPS, strips credentials/fragments, blocks localhost/private/internal targets, resolves DNS before execution, validates every redirect hop, caps redirects, and blocks unsafe final targets.
- Audit fetches use timeout, HTML content validation, and a 2 MB HTML cap.
- Sessions use HTTP-only cookies and secure cookies in production.
- Password reset UI must not expose local development reset tokens in production.

Platform hardening should also block metadata/private network egress at the network layer where the host supports it.

## Current Routes

UI routes:

- `/`
- `/signup`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/websites`
- `/websites/[id]`
- `/audits`
- `/audits/[id]`
- `/notifications`
- `/settings`
- `/admin`
- `/sample-report`
- `/share/[token]`
- `/privacy`
- `/terms`
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.webmanifest`
- `/icon.svg`
- `/apple-icon`
- `/opengraph-image`
- `/twitter-image`

API routes:

- `POST /api/audit-url`
- `GET /api/admin/health`
- `GET /api/audits/[id]/pdf`
- `POST /api/cron/run-scheduled`
- `GET /api/health`

## Current Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development server. |
| `npm run build` | Build production app. |
| `npm run start` | Start built production app. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emit. |
| `npm run test` | Run Vitest tests. |
| `npm run check` | Run lint, typecheck, tests, and build. |
| `npm run mcp` | Start local MCP stdio server. |
| `npm run audit:url -- https://example.com` | Run one direct page audit and print JSON. |
| `npm run worker:once -- 5` | Process up to five queued audit runs. |
| `npm run db:schema:check` | Verify the committed Drizzle schema table set. |

## Exact Production Deployment Checklist

1. Confirm all UI and docs describe v1 as a page audit with selected website health checks.
2. Install from a clean checkout with `npm install`.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin.
4. Set `CRON_SECRET` to a strong random value.
5. Configure the scheduler to call `POST /api/cron/run-scheduled` with `Authorization: Bearer <CRON_SECRET>`.
6. Set `ADMIN_EMAILS` to the real operator allowlist.
7. Keep `WEB_AUDIT_DEV_RESET_TOKENS=false`.
8. Choose storage mode:
   - single-node JSON: persistent private `data/`, one writer, tested backups.
   - multi-instance/serverless: implement Postgres/Drizzle first.
9. Choose worker mode:
   - single-node JSON: avoid concurrent writer processes.
   - durable production: implement a shared queue and dedicated worker.
10. Add real password-reset email delivery before relying on password reset in production.
11. Configure logs, uptime checks, cron alerts, audit failure alerts, and backup monitoring.
12. Restrict outbound egress to public HTTP/HTTPS where possible.
13. Run `npm run check`.
14. Verify public metadata:
   - `/robots.txt` allows public pages and disallows private app/API surfaces.
   - `/sitemap.xml` lists only public pages.
   - `/manifest.webmanifest`, `/icon.svg`, `/apple-icon`, `/opengraph-image`, and `/twitter-image` return successful metadata assets.
   - authenticated app routes, auth utility pages, and private shared reports include `noindex`.
15. Verify deployed flows:
   - signup/login/logout.
   - forgot-password with production-safe behavior.
   - add website.
   - run manual audit.
   - view audit report.
   - open evidence dialogs for top findings and all-findings rows.
   - export PDF and inspect the summary plus evidence appendix.
   - create share link, copy it from the modal, open it in a private window, and revoke it.
   - confirm reports show `needs_review` items separately from confirmed failed findings.
   - call `POST /api/cron/run-scheduled`.
   - confirm `/api/health` is public and minimal.
   - confirm `/admin` and `/api/admin/health` are allowlisted.
   - run MCP `validate_audit_url`, `run_page_audit`, `save_website_and_audit`, and `get_audit_report`.

Production is not considered ready until the checklist is complete and `npm run check` passes.
