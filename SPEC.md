# Web Audit — SPEC.md

## 1. Product

**Web Audit** is a website audit and monitoring platform.

It lets a user add a website, run a safe audit, view a clear report, export/share the result, schedule repeat audits, and track whether the website improves or degrades over time.

The v1 must feel like a complete product, not a demo.

## 2. Product Promise

**Know what is broken. Fix what matters.**

Web Audit should help users understand:

- what is wrong with a website
- why it matters
- how serious it is
- what evidence was found
- what should be fixed first

## 3. V1 Scope

### Included

- Landing page
- Secure authentication
- Website management
- Manual audit runs
- Background audit worker
- Audit progress states
- Audit report
- Audit history
- Score trends
- Scheduled audits
- PDF export
- Optional private share link
- In-app notifications
- Optional email alerts
- Settings
- Basic admin/system health
- Production logging and monitoring

### Audit Categories

- Performance
- SEO
- Accessibility
- Security basics
- Technical health
- Mobile readiness

### Excluded

- AI auto-fixing
- GitHub/GitLab pull requests
- Full-site crawling
- Deep vulnerability scanning
- Keyword rank tracking
- Competitor comparison
- Team workspaces
- White-label portals
- Browser extension
- Mobile app
- Complex billing unless required before launch

## 4. V1 Audit Depth

Web Audit v1 audits the submitted page as the main target.

Recommended behaviour:

- Run a complete audit on the exact submitted URL.
- Resolve redirects and store the final URL.
- Extract key internal links from the page.
- Optionally check a small limited number of internal links for broken-link/basic HTTP status issues.
- Do not perform full-site crawling in v1.

The UI must be honest.

Use wording like:

**Page audit with selected website health checks.**

Do not imply a full website crawl unless it is actually implemented.

## 5. User Types

### Guest

Can:

- view landing page
- understand the product
- sign up or log in
- optionally run a limited sample audit

Cannot:

- save websites
- save audit history
- schedule audits
- export private reports

### Registered User

Can:

- manage account
- add websites
- run audits
- view reports
- export/share reports
- schedule audits
- view history and trends
- manage notification settings

### Admin

Can:

- view failed audit jobs
- inspect queue health
- view usage totals
- review common failure reasons
- monitor system health

Keep admin minimal for v1.

## 6. Core User Journey

1. User creates an account.
2. User adds a website URL.
3. System validates and normalises the URL.
4. User starts an audit.
5. Audit is queued.
6. Worker runs checks in the background.
7. User sees progress.
8. Audit completes or fails gracefully.
9. User views the report.
10. User exports or shares the report.
11. User schedules repeat audits.
12. User tracks score changes over time.

This is the core product loop.

## 7. Functional Requirements

### 7.1 Authentication

Must include:

- email/password sign-up
- email/password login
- secure password hashing
- session management
- logout
- password reset
- protected routes
- server-side access control

Should include:

- email verification
- Google OAuth

Security rules:

- never store plaintext passwords
- never expose secrets to the client
- validate all inputs server-side
- rate-limit auth endpoints
- avoid leaking whether an email exists

### 7.2 Website Management

A user can:

- add website
- edit website name
- run audit
- view latest audit
- view audit history
- configure schedule
- delete website

Website record should store:

- user owner
- display name
- original URL
- normalised URL
- domain
- favicon if available
- monitoring/schedule status
- latest audit summary
- timestamps

### 7.3 URL Validation

Must:

- allow only HTTP/HTTPS
- normalise URLs
- follow safe redirect limits
- reject unsupported protocols
- block localhost/private/internal IP ranges by default
- prevent SSRF-style abuse
- rate-limit audit creation
- prevent duplicate running audits for the same website

### 7.4 Audit Job Flow

When an audit starts:

1. Create audit run with `queued` status.
2. Push job to queue.
3. Worker picks job.
4. Mark audit as `running`.
5. Run audit checks.
6. Normalise raw results.
7. Calculate scores.
8. Store metrics and findings.
9. Mark audit as `completed` or `failed`.
10. Update website latest audit summary.
11. Create notification.

Audit statuses:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

### 7.5 Failed Audit Handling

If an audit fails:

- store failure reason
- show user-friendly error
- log technical details
- allow retry
- do not create misleading scores from incomplete data

### 7.6 Scheduled Audits

V1 schedule options:

- manual only
- daily
- weekly
- monthly

Scheduled audits must:

- avoid overlapping runs
- respect usage limits
- update next run time
- create notifications
- handle failures cleanly

### 7.7 Notifications

Create in-app notifications for:

- audit completed
- audit failed
- critical issue found
- score dropped
- scheduled audit completed

Email alerts are optional for v1 if the email system is ready.

## 8. Audit Requirements

### 8.1 Performance

Check:

- overall performance score
- LCP
- CLS
- TTFB
- total blocking/lab responsiveness metric where available
- speed index or equivalent
- page weight
- request count
- render-blocking resources
- image optimisation
- JavaScript weight
- CSS weight
- caching opportunities
- compression issues

### 8.2 SEO

Check:

- title
- meta description
- H1
- heading structure
- canonical URL
- indexability basics
- robots meta
- robots.txt availability
- sitemap availability
- Open Graph tags
- social preview tags where useful
- structured data presence/validity where practical
- image alt text
- basic broken internal links where practical

This is a technical/on-page SEO audit, not keyword research.

### 8.3 Accessibility

Check:

- missing alt text
- colour contrast where detectable
- missing form labels
- button/link accessible names
- heading order
- ARIA misuse where detectable
- semantic structure
- keyboard/navigation warnings where detectable

State that automated accessibility checks do not catch everything.

### 8.4 Security Basics

Safe, non-invasive checks only:

- HTTPS availability
- HTTP to HTTPS redirect
- security headers
- CSP presence
- frame protection
- HSTS
- Referrer Policy
- Permissions Policy
- mixed content

Do not perform exploit testing, brute force, fuzzing, or destructive checks.

### 8.5 Technical Health

Check:

- HTTP status
- redirect chain
- final URL
- response headers
- page size
- resource count
- failed network requests
- console errors
- broken assets where practical
- favicon
- viewport meta tag
- mobile rendering basics

### 8.6 Mobile Readiness

Check:

- mobile audit profile
- viewport tag
- mobile performance
- tap target issues where detectable
- layout shift
- readable layout signals where practical
- mobile screenshot if feasible

## 9. Report Requirements

The report is the product.

Each report must include:

- audited URL
- final resolved URL
- audit date/time
- audit duration
- audit profile/device
- overall score
- category scores
- top priority issues
- findings by category
- passed checks
- metrics
- screenshots if captured
- skipped/failed checks
- export/share actions

Each finding must include:

- title
- category
- severity
- explanation
- evidence
- impact
- recommendation
- technical details where useful

Recommendations must be specific.

Bad:

> Improve performance.

Good:

> Large image files are slowing down the page. Compress oversized images, serve modern image formats, and lazy-load images below the fold.

## 10. Scoring

Category scores:

- Performance: 0–100
- SEO: 0–100
- Accessibility: 0–100
- Security Basics: 0–100
- Technical Health: 0–100
- Mobile Readiness: 0–100

Initial overall weighting:

- Performance: 25%
- SEO: 20%
- Accessibility: 20%
- Security Basics: 15%
- Technical Health: 10%
- Mobile Readiness: 10%

Severity:

- Critical: serious user, security, revenue, or indexability impact
- High: important issue to fix soon
- Medium: meaningful improvement
- Low: minor improvement
- Info: useful observation

Do not exaggerate issues.

## 11. Data Model

The implementation can choose the latest best schema style, but it must support these concepts.

### User

- id
- email
- password hash if applicable
- display name
- avatar
- timestamps

### Website

- id
- user id
- display name
- original URL
- normalised URL
- domain
- favicon
- schedule status
- latest audit id
- timestamps

### Audit Run

- id
- website id
- user id
- status
- started at
- completed at
- failure reason
- overall score
- category scores
- duration
- audit profile
- raw result reference if needed
- timestamps

### Finding

- id
- audit run id
- category
- severity
- title
- description
- evidence
- recommendation
- impact
- technical details
- passed/failed status
- sort priority

### Metric

- audit run id
- key
- value
- unit
- category

### Schedule

- website id
- frequency
- enabled
- last run
- next run
- alert threshold
- timestamps

### Notification

- user id
- website id
- audit run id
- type
- title
- message
- read status
- timestamp

### Share Link

If implemented:

- audit run id
- token
- enabled
- expiry
- revoked timestamp

## 12. Usage Limits

Add internal limits from day one.

Minimum limits:

- audits per user per hour
- audits per website per hour
- max websites per user
- max scheduled audits
- max audit runtime
- max redirects
- max page size
- max internal links checked

Do not hardcode unlimited usage everywhere.

## 13. Technology Direction

Use TypeScript across the product.

The agent must choose the latest stable production-ready tools at implementation time.

Recommended direction:

- React-based full-stack framework
- TypeScript
- PostgreSQL
- type-safe ORM/query layer
- queue/background job system
- browser automation for audits
- audit libraries for performance/accessibility checks
- server-side PDF generation
- secure auth
- production logging
- error tracking
- scheduled jobs/cron
- deployment with worker support

Do not lock implementation to versions in this file.

Always check current official documentation before implementation.

## 14. Non-Functional Requirements

### Performance

- app pages must load quickly
- audit jobs must run in background
- large histories must be paginated
- charts must not block rendering
- reports must be efficient to load

### Security

- secure auth
- server-side validation
- access control per user
- SSRF protection
- rate limiting
- safe URL handling
- no private network scanning
- no secrets in client bundle
- audit logs for critical actions

### Privacy

- websites and reports are private by default
- share links are opt-in
- users can revoke links
- account deletion path exists
- private data must not leak between users

### Reliability

- retry temporary audit failures
- time out long jobs
- close browser instances properly
- store failure reasons
- protect against partial writes
- back up database

### Accessibility

The app itself must be accessible:

- semantic HTML
- keyboard support
- visible focus states
- good contrast
- labelled forms
- accessible charts or text summaries

## 15. Testing

Minimum tests:

- auth flows
- URL validation
- add website
- manual audit trigger
- audit job creation
- audit result storage
- score calculation
- severity mapping
- report view
- PDF export if implemented
- schedule logic
- access control
- failed audit handling

Critical E2E flow:

1. Sign up.
2. Add website.
3. Run audit.
4. Wait for completion.
5. View report.
6. Export/share report.
7. Log out.
8. Log back in.
9. Confirm audit history remains.

## 16. Production Checklist

Before launch:

- app builds
- worker builds
- migrations are safe
- auth is secure
- env vars configured
- queue configured
- scheduled jobs configured
- logging enabled
- error tracking enabled
- backups configured
- rate limits active
- SSRF protection tested
- failed audits tested
- PDF export tested
- mobile layout tested
- dark/light mode tested
- privacy and terms pages added
- production deployment complete

## 17. Acceptance Criteria

V1 is complete when:

- user can create an account
- user can add a safe valid website
- unsafe URLs are rejected
- user can run an audit
- audit runs in background
- progress/status is visible
- audit completes or fails gracefully
- report is clear and polished
- findings are prioritised
- recommendations are practical
- history is saved
- trends are visible
- report can be exported
- scheduled audits work
- notifications work
- user data is isolated
- app works on desktop and mobile
- tests cover the main flows
- production monitoring is active

## 18. Final Build Rule

Build Web Audit as a real v1 product.

Keep the loop excellent:

**Add website → Run audit → Understand issues → Export/share report → Track improvement**

Everything else must support that loop.
