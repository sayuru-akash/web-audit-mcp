# Web Audit — Full Agent Development Brief

## 1. Product Direction

Web Audit is a production-grade website auditing, monitoring, issue detection, and improvement recommendation platform. It helps businesses, developers, agencies, and website owners understand what is wrong with a website, how serious each issue is, and what should be fixed first.

The v1 should focus on reliable website audits, clean reports, practical recommendations, and a strong professional interface. It should not try to become a fully autonomous bug-fixing system in the first version, but the architecture should be ready for future AI-assisted diagnostics, automated pull requests, and deeper engineering integrations.

The product must feel serious, trustworthy, and technically competent. It should be simple enough for business users to understand, but detailed enough that developers can act on the findings.

This document is written for an intelligent development agent. Do not blindly follow outdated package names, old framework syntax, or old implementation patterns. Before implementation, verify the latest stable documentation for all selected tools, libraries, APIs, SDKs, browser automation tools, auditing tools, deployment platforms, authentication patterns, and database best practices.

Do not create experimental complexity unless it directly improves the v1. The product must feel complete, but the engineering must stay lean.

---

## 2. Core Product Promise

Web Audit helps users scan a website, identify key technical and business-facing problems, and receive clear, prioritised recommendations.

A user should be able to:

- Add a website.
- Run a full website audit.
- View performance, SEO, accessibility, best practice, security, and technical health findings.
- Understand what each issue means.
- See clear priority levels.
- Track audit history over time.
- Export or share a professional report.
- Monitor selected websites on a recurring basis.
- Receive alerts when important scores or checks degrade.

The v1 must prioritise clarity, trust, accuracy, and repeatable auditing over flashy automation.

---

## 3. Final Product Name

Name: Web Audit

Reasoning:

Web Audit is direct, credible, easy to remember, and immediately communicates the product value. It works well for agencies, SaaS products, SMEs, developers, and enterprise-facing website health use cases.

Tone of the brand:

- Professional
- Clean
- Technical but understandable
- Trustworthy
- Minimal
- Action-focused

Possible tagline options:

- Audit your website before your customers do.
- Find what is slowing your website down.
- Website health, performance, SEO, and accessibility in one clean report.
- Know what is broken. Fix what matters.

Recommended v1 tagline:

Know what is broken. Fix what matters.

---

## 4. Chosen Language and Stack Direction

The preferred language direction for this v1 is TypeScript across the main application.

Reason:

- Strong full-stack consistency.
- Better type safety for frontend, backend, audit workers, API responses, and database access.
- Strong ecosystem for modern web apps, browser automation, queues, report generation, and API integrations.
- Easier maintainability for a single product codebase.
- Better developer experience for an AI-assisted engineering workflow.

Recommended primary stack:

- Frontend and full-stack app: modern React-based full-stack framework using TypeScript. You must select the best current stable framework not based on being trendy but based on production readiness, performance, developer experience, and suitability for this product. Must be something able to run anywhere and not lock the product into a specific hosting provider or environment.
- Styling: utility-first CSS with a premium component system and custom design layer. (Use the best library for the chosen framework, but avoid anything that looks like a default template. The product must feel custom and polished. And even a library with many pre-built components can be styled to look unique with the right design work.)
- Backend: server-side routes/actions/API handlers within the full-stack framework where suitable.
- Audit worker/runtime: TypeScript worker process using browser automation and audit libraries.
- Browser automation: a reliable headless browser automation tool.
- Database: PostgreSQL. (Local and Neon When necessary for development, but production-ready hosting for v1.)
- ORM/query layer: a type-safe ORM or query builder suitable for production PostgreSQL usage. (Make the best current choice based on stability, performance, and developer experience.)
- Queue/background jobs: a reliable queue system suitable for scheduled audits and long-running scan jobs.
- Authentication: secure email/password and OAuth-ready auth implementation.
- Report generation: server-side HTML/PDF generation or structured export based on latest reliable libraries.
- Deployment: production web deployment with worker hosting, database hosting, environment variables, secure secrets, logs, monitoring, backups, and rollback support.

The agent must check the latest stable choices before implementing. Use the current best stable framework, auth library, database client, queue, browser automation tool, UI component library, and deployment configuration. Avoid outdated syntax.

Do not lock this product to a specific framework version inside the implementation plan. Use the latest stable production-ready release at build time.

---

## 5. Important Product Boundary for v1

Web Audit v1 is not trying to be:

- A full autonomous AI developer.
- A replacement for professional developers.
- A full enterprise observability platform.
- A vulnerability scanner for deep penetration testing.
- A full uptime monitoring company.
- A full SEO agency platform with keyword tracking.
- A crawling platform at Screaming Frog scale.
- A website builder.

Web Audit v1 is a polished audit and monitoring product.

The product may later expand into AI-generated fixes, GitHub pull requests, competitor audits, white-label agency portals, client workspaces, and automated remediation workflows. Do not overbuild those in v1.

---

## 6. User Types

### 6.1 Guest User

A guest user can:

- Visit the landing page.
- Understand what Web Audit does.
- Run a limited sample audit if this is allowed in v1.
- View sign-in and sign-up screens.

A guest user cannot:

- Save audit history.
- Add multiple websites.
- Schedule audits.
- Export branded reports.
- Access private user data.

### 6.2 Registered User

A registered user can:

- Manage their account.
- Add websites.
- Run audits.
- View audit results.
- Track score history.
- Export reports.
- Schedule recurring audits.
- Manage alert preferences.
- Delete websites and audit data.

### 6.3 Admin or Internal Operator

Admin can:

- View users and usage summaries.
- View system health.
- Inspect failed audit jobs.
- Review external API or audit engine failures.
- Manage abuse prevention where needed.

Do not build a bloated admin system in v1. Build only what is needed to operate the platform safely.

---

## 7. Core User Journeys

### 7.1 New User Journey

1. User lands on Web Audit.
2. User understands that the product audits website health and shows what to fix.
3. User signs up using email or OAuth.
4. User lands on onboarding.
5. User adds their first website.
6. User runs the first audit.
7. User sees a clean report with overall score, issue categories, priorities, and recommendations.

The first completed audit must feel valuable and professional.

### 7.2 Website Audit Journey

1. User adds a website URL.
2. System validates the URL.
3. System creates a website record.
4. User starts audit.
5. Audit job enters queue.
6. Worker runs checks.
7. App shows audit progress.
8. Audit completes.
9. User views report.
10. User can export, share, or schedule future audits.

### 7.3 Recurring Monitoring Journey

1. User enables scheduled audits for a website.
2. User selects frequency.
3. System runs audits automatically.
4. User sees historical score trends.
5. User receives alert if performance, SEO, accessibility, security, or availability degrades beyond threshold.

For v1, scheduled audits can be simple. Do not build advanced incident management yet.

### 7.4 Report Sharing Journey

1. User opens completed audit.
2. User clicks export/share.
3. System generates a professional report.
4. Report includes scores, issue list, priorities, explanations, and recommendations.
5. User can download PDF or share a private link if implemented.

Agency users should be able to use the report with clients.

---

## 8. Core Features for v1

### 8.1 Authentication

Build secure authentication with:

- Email and password sign-up.
- Email and password login.
- Secure password hashing.
- Session management.
- Forgot password flow.
- Email verification if practical for v1.
- OAuth support if selected, preferably Google sign-in.
- Protected routes.
- Proper logout.
- Account deletion or data deletion request path.

Authentication must be production-grade, not tutorial-grade.

Security expectations:

- Never store plaintext passwords.
- Protect sessions.
- Use CSRF protection where applicable.
- Use secure cookies where applicable.
- Validate all inputs server-side.
- Rate-limit sensitive endpoints.
- Avoid leaking whether an email exists in password reset flows.

### 8.2 User Profile

Each user should have:

- Display name.
- Email.
- Optional avatar.
- Account creation date.
- Preferences.
- Default audit frequency.
- Notification preferences.

Profile editing in v1:

- Update display name.
- Update avatar if simple and safe.
- Change password.
- Delete account or request deletion.

### 8.3 Website Management

A user can add and manage websites.

Website fields:

- Website name.
- Website URL.
- Normalised domain.
- Favicon if available.
- Ownership/user relation.
- Created timestamp.
- Last audit timestamp.
- Current overall score.
- Monitoring status.

Website actions:

- Add website.
- Edit display name.
- Run audit.
- View audit history.
- Configure schedule.
- Delete website.

URL validation:

- Require valid HTTP or HTTPS URL.
- Normalise trailing slashes.
- Prevent unsupported protocols.
- Prevent localhost/private network abuse unless explicitly allowed for internal deployments.
- Add rate limits to prevent scanning abuse.

### 8.4 Audit Engine

The audit engine is the heart of the product.

It should run a structured set of checks across key categories:

1. Performance.
2. SEO.
3. Accessibility.
4. Best practices.
5. Security basics.
6. Technical health.
7. Mobile readiness.
8. Content structure.

Use trusted audit tools where practical, but normalise their output into a clean Web Audit scoring model.

The audit engine should support:

- Running on demand.
- Running in background jobs.
- Storing raw results where useful.
- Storing normalised results for UI/reporting.
- Handling audit failures gracefully.
- Timing out long jobs safely.
- Retrying temporary failures.

### 8.5 Performance Audit

Performance checks should include:

- Overall performance score.
- Page load metrics.
- Core Web Vitals where available.
- Largest Contentful Paint.
- Cumulative Layout Shift.
- Interaction-related responsiveness metric where available.
- Time to First Byte.
- Total Blocking Time or equivalent lab metric.
- Speed Index or equivalent.
- Render-blocking resources.
- Image optimisation issues.
- JavaScript weight.
- CSS weight.
- Font loading issues.
- Caching opportunities.
- Compression issues.

Recommendations must be written in practical language.

Example:

Instead of only saying Reduce unused JavaScript, explain that heavy unused JavaScript increases loading time and should be split, removed, delayed, or loaded only when needed.

### 8.6 SEO Audit

SEO checks should include:

- Page title presence and quality.
- Meta description presence and quality.
- H1 presence and count.
- Heading structure.
- Canonical URL.
- Indexability basics.
- Robots meta tag.
- Robots.txt availability.
- Sitemap availability.
- Open Graph tags.
- Twitter/X card tags if relevant.
- Structured data presence and validity where possible.
- Image alt text coverage.
- Internal link basics.
- Broken links where feasible for v1.
- Mobile-friendly metadata.

Do not pretend to do full keyword research in v1. This is a technical/on-page SEO audit, not a complete SEO campaign platform.

### 8.7 Accessibility Audit

Accessibility checks should include:

- Missing alt text.
- Colour contrast issues where detectable.
- Missing form labels.
- Button/link name issues.
- Heading order.
- ARIA misuse where detectable.
- Keyboard navigation issues where detectable.
- Landmarks and semantic structure.

Use reliable automated accessibility testing tools, but explain that automated checks do not catch every accessibility issue.

### 8.8 Best Practices Audit

Best practice checks should include:

- Console errors.
- Deprecated APIs where detected.
- Browser errors.
- HTTPS usage.
- Mixed content.
- Safe links to external destinations.
- Image aspect ratio issues.
- Third-party script weight.
- Basic browser compatibility warnings where possible.

### 8.9 Security Basics Audit

This is not a penetration test.

Security checks should include safe, non-invasive checks such as:

- HTTPS availability.
- HTTP to HTTPS redirect.
- Security headers.
- Content Security Policy presence.
- X-Frame-Options or frame protection equivalent.
- HSTS.
- Referrer Policy.
- Permissions Policy.
- Mixed content.
- Exposed obvious sensitive files only if safe and lawful to check.

Avoid aggressive vulnerability scanning in v1.

Do not perform intrusive tests, brute force, exploitation, or destructive checks.

### 8.10 Technical Health Audit

Technical health checks should include:

- HTTP status.
- Redirect chain.
- Final URL.
- Response headers.
- Page size.
- Resource count.
- Broken assets where feasible.
- JavaScript runtime errors.
- Failed network requests.
- Favicon availability.
- Mobile viewport tag.
- Basic HTML validity signals where practical.

### 8.11 Mobile Readiness Audit

Mobile checks should include:

- Viewport meta tag.
- Mobile screenshot capture if feasible.
- Mobile performance score.
- Tap target issues where detectable.
- Layout shift issues.
- Font readability signals where available.

### 8.12 Audit Report

Each audit report should include:

- Overall score.
- Category scores.
- Critical issues.
- High priority issues.
- Medium priority issues.
- Low priority issues.
- Passed checks.
- Practical recommendations.
- Audit metadata.
- Timestamp.
- Device/profile used.
- Screenshots if captured.

Report must be understandable to both business and technical users.

Issue detail should include:

- Title.
- Category.
- Severity.
- Explanation.
- Evidence.
- Recommended fix.
- Impact.
- Technical details if available.

### 8.13 Audit History

Users should be able to view previous audits for each website.

History should show:

- Date/time.
- Overall score.
- Category scores.
- Number of critical/high issues.
- Status: completed, failed, cancelled.

Allow opening any previous audit.

### 8.14 Score Trends

For v1, include simple trend views:

- Overall score over time.
- Performance score over time.
- SEO score over time.
- Accessibility score over time.
- Security/basic health score over time.

Do not overbuild analytics charts. Keep it clean.

### 8.15 Scheduled Audits

Allow users to schedule recurring audits.

Recommended v1 options:

- Manual only.
- Daily.
- Weekly.
- Monthly.

Each website can have one schedule setting.

Scheduling must be implemented through a reliable background job/cron mechanism.

### 8.16 Alerts

Alert users when:

- A scheduled audit fails.
- Overall score drops beyond configured threshold.
- A critical issue appears.
- Website becomes unreachable.

V1 alert channels:

- In-app notifications.
- Email notifications if email infrastructure is configured.

Do not build Slack/Discord/webhook integrations in v1 unless the core product is complete.

### 8.17 PDF Export

Users should be able to export a completed audit as a professional PDF.

PDF should include:

- Brand/header.
- Website name and URL.
- Audit date.
- Overall score.
- Category scores.
- Top issues.
- Detailed findings.
- Recommendations.
- Disclaimer that automated audits do not replace manual expert review.

The PDF must look clean enough to send to a client.

### 8.18 Shareable Report Link

Optional but valuable for v1.

If implemented:

- Generate private share token.
- Allow user to enable/disable sharing.
- Public report should not expose user account details.
- Allow revoking link.

---

## 9. Data Model Requirements

Do not follow a rigid table design from this document if a better latest practice is found, but the final database must support these concepts cleanly.

### 9.1 User

Represents an account.

Required data:

- Unique ID.
- Email.
- Password hash if using password auth.
- Display name.
- Avatar URL if supported.
- Created timestamp.
- Updated timestamp.
- Last login timestamp if needed.

### 9.2 Website

Represents a website added by a user.

Required data:

- Unique ID.
- User ID or workspace ID if workspaces are introduced later.
- Display name.
- Original URL.
- Normalised URL.
- Domain.
- Favicon URL if available.
- Monitoring status.
- Schedule frequency.
- Last audit ID.
- Created timestamp.
- Updated timestamp.

### 9.3 Audit Run

Represents one execution of an audit.

Required data:

- Unique ID.
- Website ID.
- User ID.
- Status: queued, running, completed, failed, cancelled.
- Started timestamp.
- Completed timestamp.
- Failed timestamp if applicable.
- Failure reason if applicable.
- Overall score.
- Category scores.
- Runtime duration.
- Audit profile/device.
- Raw result reference if stored separately.
- Created timestamp.

### 9.4 Audit Finding

Represents a single issue or passed check.

Required data:

- Unique ID.
- Audit run ID.
- Category.
- Severity.
- Title.
- Description.
- Evidence.
- Recommendation.
- Impact.
- Technical details.
- Passed/failed status.
- Sort priority.

Severity values:

- critical
- high
- medium
- low
- info

### 9.5 Audit Metric

Represents numeric metrics captured during audit.

Examples:

- LCP.
- CLS.
- TTFB.
- Total page size.
- Request count.
- JavaScript size.
- CSS size.
- Image size.
- Response time.

Required data:

- Audit run ID.
- Metric key.
- Metric value.
- Unit.
- Category.

### 9.6 Scheduled Job / Audit Schedule

Represents recurring audit settings.

Required data:

- Website ID.
- Frequency.
- Enabled boolean.
- Last run timestamp.
- Next run timestamp.
- Alert threshold.
- Created timestamp.
- Updated timestamp.

### 9.7 Notification

Represents in-app notifications.

Required data:

- User ID.
- Website ID if relevant.
- Audit run ID if relevant.
- Type.
- Title.
- Message.
- Read status.
- Created timestamp.

### 9.8 Share Token

If shareable reports are implemented:

- Audit run ID.
- Token.
- Enabled status.
- Expiry timestamp if supported.
- Created timestamp.
- Revoked timestamp.

---

## 10. Audit Scoring Model

The scoring model must be consistent, explainable, and not misleading.

Recommended category scores:

- Performance: 0 to 100.
- SEO: 0 to 100.
- Accessibility: 0 to 100.
- Best Practices: 0 to 100.
- Security Basics: 0 to 100.
- Technical Health: 0 to 100.

Overall score:

Use a weighted average.

Recommended initial weighting:

- Performance: 25%.
- SEO: 20%.
- Accessibility: 20%.
- Best Practices: 15%.
- Security Basics: 10%.
- Technical Health: 10%.

The agent may adjust this if better evidence or latest tooling conventions suggest a stronger model.

Severity mapping:

- Critical: likely severe user, security, revenue, or indexability impact.
- High: important issue that should be fixed soon.
- Medium: meaningful improvement opportunity.
- Low: minor improvement.
- Info: useful observation.

Do not exaggerate every issue as critical. Trust depends on sensible prioritisation.

---

## 11. External Tools and Audit Integrations

The agent should select the best current tools for:

- Browser automation.
- Lab performance audits.
- Accessibility checks.
- HTML/meta extraction.
- Security header checks.
- Broken link/resource detection.
- Screenshot capture.
- PDF generation.

Before implementation, verify latest official documentation and current compatibility.

Integration expectations:

- Run checks server-side or in worker context.
- Never expose sensitive infrastructure details to users.
- Time out long-running audits.
- Sanitize and normalise URLs.
- Store raw tool output only where useful.
- Convert raw outputs into clean, readable findings.

---

## 12. UI and UX Direction

Web Audit should feel like a premium technical dashboard that non-technical users can still understand.

Visual direction:

- Clean SaaS interface.
- Minimal but confident.
- White/light mode first with excellent dark mode.
- Clear score cards.
- Beautiful issue tables.
- Strong spacing.
- Professional charts.
- Rounded cards.
- Subtle borders.
- No childish colours.
- No overwhelming dashboards.

Brand feeling:

- Sharp.
- Reliable.
- Modern.
- Technical.
- Practical.

Important design principles:

- Scores must be visible and clear.
- Issues must be prioritised.
- Recommendations must be easy to act on.
- Business users should understand impact.
- Developers should see technical evidence.
- Empty states must guide the user.
- Audit progress must feel alive and reliable.
- Mobile UX should work, but desktop dashboard quality is very important.

---

## 13. Core Screens

### 13.1 Landing Page

Purpose:

Convert new visitors into users.

Sections:

- Hero section with product promise.
- Website URL input or CTA.
- Feature cards.
- Audit category explanation.
- Example report preview.
- Use cases for agencies, founders, developers, and businesses.
- Call to action.
- Simple footer.

Hero copy direction:

Audit your website’s performance, SEO, accessibility, security basics, and technical health in one clean report.

### 13.2 Sign Up

Requirements:

- Email.
- Password.
- Display name.
- OAuth option if implemented.
- Terms/privacy acknowledgement if required.
- Friendly validation.

### 13.3 Login

Requirements:

- Email.
- Password.
- Forgot password.
- OAuth option if implemented.

### 13.4 Dashboard

Must include:

- Website list.
- Add website CTA.
- Recent audits.
- Overall average score.
- Alerts or critical issues.
- Scheduled audit status.

### 13.5 Add Website

Must include:

- URL input.
- Website name optional.
- Validation.
- Abuse protection.
- Immediate run audit option.

### 13.6 Website Detail

Must include:

- Website name and URL.
- Current score.
- Latest audit summary.
- Audit history.
- Schedule settings.
- Alerts.
- Run audit button.

### 13.7 Audit Progress

Must include:

- Current status.
- Audit steps.
- Progress indication.
- Friendly message for long-running audits.
- Failure handling.

### 13.8 Audit Report

Must include:

- Overall score.
- Category scores.
- Top priority issues.
- Findings by category.
- Passed checks.
- Metrics.
- Screenshots if captured.
- Export/share actions.

### 13.9 Audit History

Must include:

- List/table of previous audits.
- Date/time.
- Scores.
- Status.
- Open report action.

### 13.10 Notifications

Must include:

- In-app notifications for audit completion/failure and score drops.

### 13.11 Settings

Account, profile, notifications, theme, logout.

### 13.12 Admin/System Health

If implemented:

- Failed jobs.
- Audit queue status.
- Recent errors.
- Usage summary.

### 13.13 Error Pages

Build polished:

- 404 page.
- Generic error page.
- Unauthorised page.
- Audit failed page/state.

---

## 14. Functional Rules

### 14.1 Adding a Website

When a user adds a website:

1. Validate URL.
2. Normalise URL.
3. Prevent unsupported protocols.
4. Check for duplicates under same user.
5. Create website record.
6. Optionally fetch favicon/basic metadata.
7. Offer to run first audit.

### 14.2 Running an Audit

When audit starts:

1. Create audit run with queued status.
2. Push job to queue.
3. Worker picks up job.
4. Audit status changes to running.
5. Worker runs checks.
6. Results are normalised.
7. Scores are calculated.
8. Findings are stored.
9. Audit status changes to completed or failed.
10. Website last audit summary updates.
11. Notification is created.

### 14.3 Failed Audits

If audit fails:

- Store failure reason.
- Show friendly user-facing explanation.
- Log technical details.
- Allow retry.
- Do not create misleading scores from incomplete data.

### 14.4 Duplicate Audits

Prevent excessive duplicate audits:

- Rate-limit manual audit runs.
- Prevent multiple running audits for the same website unless intentionally allowed.
- Show current audit progress instead of starting duplicates.

### 14.5 Scheduled Audits

Scheduled jobs should:

- Find websites due for audit.
- Queue audit jobs.
- Update next run time.
- Avoid overlapping runs.
- Handle failures cleanly.

### 14.6 Report Export

When exporting:

- Use completed audit data.
- Generate PDF reliably.
- Avoid exposing private user data.
- Include generated timestamp.

---

## 15. Non-Functional Requirements

### 15.1 Performance

The app must feel fast even when audit jobs take time.

Requirements:

- Fast dashboard load.
- Paginated audit history.
- Efficient database queries.
- Background processing for audits.
- No long audit process blocking web requests.
- Cache repeated website metadata where useful.
- Optimised charts and report rendering.

### 15.2 Security

Must include:

- Strong auth implementation.
- Server-side validation.
- Input sanitisation.
- Secure cookies/sessions.
- Rate limiting for auth and audit endpoints.
- URL validation to prevent SSRF-style abuse.
- Block private/internal IP ranges unless explicitly configured for private deployments.
- No secrets in client bundle.
- Proper access control on every user-specific query.
- Safe handling of external website responses.
- Protection against common web app risks.

### 15.3 Privacy

Requirements:

- User websites and reports are private by default.
- Share links must be opt-in.
- Users can revoke share links.
- Delete website removes associated audit data or marks it for deletion based on implementation policy.
- Account deletion path exists.

### 15.4 Accessibility

The product itself must follow accessibility best practices:

- Keyboard navigation.
- Proper semantic HTML.
- Good contrast.
- Visible focus states.
- Accessible form labels.
- Meaningful button text.
- Accessible charts or text summaries.

### 15.5 Reliability

Requirements:

- Queue jobs should be retryable.
- Failed jobs should not corrupt data.
- Audit worker should handle timeouts.
- Browser instances should close properly.
- External website failures should be handled.
- Logs should be clear enough to debug.
- Backups should be configured.

### 15.6 Maintainability

Requirements:

- Type-safe code.
- Clear domain boundaries.
- Reusable components.
- Consistent naming.
- Clean validation schemas.
- Avoid unnecessary abstraction.
- Avoid giant components.
- Keep scoring rules testable.
- Keep audit normalisation testable.

---

## 16. Validation Rules

All user input must be validated on the server.

Examples:

- Email must be valid.
- Password must meet secure minimum requirements.
- Display name must have safe length.
- Website URL must be valid.
- Website URL must not use unsupported protocols.
- Audit frequency must be one of allowed values.
- Share token actions must be authorised.
- Alert thresholds must be within safe range.

Do not trust client-side validation alone.

---

## 17. Error Handling

Every critical operation must handle:

- Loading state.
- Success state.
- Empty state.
- Validation error.
- Server error.
- External website error.
- Audit timeout.
- Queue failure.
- Permission error.

Error messages should be human and useful.

Example:

Bad: Job failed.

Good: We couldn’t complete this audit because the website did not respond in time. Please try again later.

Log the technical details server-side.

---

## 18. Testing Expectations

The v1 must not be shipped without testing.

Minimum testing coverage:

- Auth flows.
- Add website.
- URL validation.
- Manual audit trigger.
- Audit job creation.
- Audit result storage.
- Score calculation.
- Finding severity mapping.
- Report view.
- PDF export if implemented.
- Scheduled audit logic.
- Access control between users.
- Basic UI rendering.
- Critical API/server actions.

Testing types:

- Unit tests for scoring and normalisation logic.
- Integration tests for database operations.
- Worker/job tests for audit flow.
- End-to-end tests for main user journeys.
- Basic accessibility checks.

Critical E2E flow:

1. User signs up.
2. User adds website.
3. User starts audit.
4. Audit completes.
5. User views report.
6. User exports or shares report.
7. User logs out and logs back in.
8. Audit history persists.

Another flow:

1. User enables weekly scheduled audits.
2. System records schedule.
3. Scheduled job queues audit.
4. Audit result appears in history.

---

## 19. Production Readiness Checklist

Before v1 launch, ensure:

- App builds successfully.
- Worker builds successfully.
- Database migrations are safe.
- Auth is secure.
- Environment variables are configured.
- External API/tool keys are protected if used.
- Error logging is active.
- Queue monitoring exists.
- Basic analytics are active if needed.
- Backups are configured.
- Rate limiting exists for sensitive routes.
- SSRF protections exist for website scanning.
- Sitemap and metadata exist for public pages.
- Privacy policy and terms pages exist at least as initial versions.
- 404 and error pages are polished.
- Mobile UI is tested.
- Dark and light modes are tested.
- Empty states are tested.
- Slow audit behaviour is tested.
- Failed audit behaviour is tested.
- PDF/report export is tested.

---

## 20. SEO and Public Pages

Public SEO pages:

- Home page.
- Features page if needed.
- Pricing page placeholder if monetisation is planned.
- Privacy policy.
- Terms.

Metadata:

- Proper title.
- Description.
- Open Graph image.
- Favicon.
- Mobile icons.

Recommended title:

Web Audit — Know What Is Broken. Fix What Matters.

Recommended description:

Audit your website’s performance, SEO, accessibility, security basics, and technical health in one clean, actionable report.

---

## 21. Notifications

V1 notifications:

- Audit completed.
- Audit failed.
- Critical issue found.
- Score dropped.
- Scheduled audit completed.

Channels:

- In-app notifications.
- Email if email infrastructure is configured.

Can wait:

- Slack integration.
- Discord integration.
- Webhooks.
- SMS.

---

## 22. Analytics

Use lightweight privacy-respecting analytics if needed.

Track product events such as:

- Sign up completed.
- Website added.
- Audit started.
- Audit completed.
- Report exported.
- Schedule enabled.
- Share link created.

Do not track sensitive content unnecessarily.

---

## 23. Admin and Observability

Minimum observability:

- Application error tracking.
- Worker error tracking.
- Server logs.
- Queue status.
- Failed audit logs.
- Database query error logs.
- Audit runtime metrics.

Optional admin page:

- Total users.
- Total websites.
- Total audits.
- Failed jobs.
- Average audit runtime.
- Recent system errors.

No heavy admin dashboard needed for v1.

---

## 24. Deployment and Hosting Expectations

The agent should select the best current deployment path based on the chosen framework, database, queue, and worker requirements.

Requirements:

- Secure environment variables.
- Build pipeline.
- Database migrations.
- Worker deployment.
- Queue infrastructure.
- Scheduled job/cron setup.
- Preview deployments if available.
- Production deployment.
- Rollback path.
- Monitoring.
- Logs.
- Backups.

The deployment must not depend on local-only behaviour.

---

## 25. Suggested Build Priority

Build in this order:

1. Product shell and design system.
2. Database schema and auth.
3. Website management.
4. Audit job model and queue.
5. Basic audit worker.
6. Performance audit integration.
7. SEO and metadata audit.
8. Accessibility checks.
9. Security header and technical health checks.
10. Audit report UI.
11. Audit history and trends.
12. PDF export.
13. Scheduled audits.
14. Notifications.
15. Admin/system health basics.
16. Testing and hardening.
17. Production deployment.

Do not start with AI auto-fixing. Start with the core loop:

Add website → Run audit → Understand issues → Export report → Track improvement.

---

## 26. AI Agent Implementation Instructions

The development agent must follow these rules:

- Check latest official documentation before selecting exact package versions or syntax.
- Use stable production-ready libraries, not unstable experimental features unless clearly justified.
- Do not hardcode secrets.
- Do not expose API keys to the browser.
- Do not allow arbitrary unsafe network scanning.
- Do not scan private/internal networks by default.
- Do not perform intrusive security testing.
- Do not exaggerate findings.
- Do not build AI auto-fixing in v1 unless all audit/reporting basics are complete.
- Do not overengineer microservices.
- Do not create unnecessary folder/documentation noise.
- Keep code clean, typed, and maintainable.
- Use server-side access control for every user-specific operation.
- Implement polished loading, empty, failed, and success states.
- Make desktop dashboard UX excellent and mobile UX solid.
- Add meaningful tests before calling the app complete.
- Make the app deployable and production-ready.

The agent should make reasonable technical decisions and document only important trade-offs.

---

## 27. Design Quality Bar

The interface must not look like a default template.

Required quality signs:

- Clean layout rhythm.
- Proper spacing.
- Strong score cards.
- Professional issue tables.
- Clear severity badges.
- Polished charts.
- Good skeleton loading.
- Proper modals/drawers.
- No messy forms.
- No inconsistent buttons.
- No random colours.
- No unreadable charts.
- No broken mobile layout.

The product should look credible enough to sell to agencies, founders, and businesses.

---

## 28. Recommended v1 Feature Set Summary

Must-have:

- Landing page.
- Auth.
- Add website.
- Manual audit run.
- Audit queue/worker.
- Performance checks.
- SEO checks.
- Accessibility checks.
- Security basics checks.
- Technical health checks.
- Audit report.
- Audit history.
- Score trends.
- PDF export.
- Scheduled audits.
- In-app notifications.
- Settings.
- Dark/light mode.
- Production deployment.
- Error tracking.
- Tests.

Should-have:

- OAuth login.
- Shareable report links.
- Screenshots in reports.
- Email alerts.
- Simple admin/system health.

Can wait:

- AI-generated code fixes.
- GitHub/GitLab pull requests.
- Team workspaces.
- White-label reports.
- Competitor comparison.
- Keyword rank tracking.
- Full crawl audits.
- Deep vulnerability scanning.
- Slack/webhook integrations.
- Mobile app.

---

## 29. Suggested Copy and Microcopy

### Empty Dashboard

No websites added yet.
Add your first website and run a full audit in a few minutes.

Button: Add website

### Empty Audit History

No audits yet.
Run your first audit to see performance, SEO, accessibility, security basics, and technical health insights.

Button: Run audit

### Audit Started

Your audit has started. We’re checking the website now.

### Audit Completed

Audit completed. Your report is ready.

### Audit Failed

We couldn’t complete this audit. Please check whether the website is online and try again.

### Critical Issue Found

A critical issue was found and should be reviewed first.

### Score Dropped

Your latest audit score dropped compared to the previous run.

### Export Success

Report exported successfully.

---

## 30. Important Data, Legal, and Safety Notes

Because Web Audit scans websites, the agent must implement safe limits.

Must verify and handle:

- Website scanning legality and terms.
- Abuse prevention.
- Rate limiting.
- Private network blocking.
- User consent through terms.
- Non-invasive security checks only.
- Data retention policy.
- Report privacy.

Security auditing must remain basic and non-invasive in v1.

Do not include exploit attempts, credential attacks, fuzzing, destructive checks, or intrusive vulnerability tests.

---

## 31. Acceptance Criteria

The v1 is complete only when:

1. A new user can sign up and log in securely.
2. A user can add a valid website.
3. Invalid and unsafe URLs are rejected.
4. A user can start a manual audit.
5. Audit runs through a background worker.
6. Audit progress/status is visible.
7. Audit results are stored correctly.
8. Overall and category scores are calculated.
9. Findings are prioritised by severity.
10. User can view a clean audit report.
11. User can view audit history.
12. User can see score trends.
13. User can export a report as PDF.
14. User can enable scheduled audits.
15. Notifications are created for audit completion/failure.
16. Data access is secure per user.
17. Failed audits are handled gracefully.
18. App works on desktop and mobile.
19. Tests cover the critical journeys.
20. App is deployed to production.
21. Monitoring/logging is enabled.

---

## 32. V1 Scope Lock and Necessary Product Decisions

Web Audit v1 should be treated as a complete first product, not a half-built preview of a future platform.

The v1 should deliver one strong promise extremely well:

Add a website, run a safe audit, understand what matters, export a professional report, and track whether the website improves over time.

Do not mention or build future-facing features inside the v1 product experience unless they are required for the current workflow.

### 32.1 Final V1 Product Shape

The final v1 product should include:

- A polished landing page.
- Secure user accounts.
- Website management.
- Manual audits.
- Scheduled audits.
- Background audit worker.
- Website health report.
- Performance checks.
- SEO checks.
- Accessibility checks.
- Security basics checks.
- Technical health checks.
- Mobile readiness checks.
- Audit history.
- Score trends.
- PDF export.
- Shareable report link if implemented cleanly.
- In-app notifications.
- Email alerts if email infrastructure is ready.
- Settings.
- Admin/system health basics.
- Production monitoring and logging.

This is enough for a serious v1.

### 32.2 Audit Depth Decision

For v1, Web Audit should audit the submitted URL as the primary page.

Recommended v1 behaviour:

- Run a complete audit on the exact submitted page.
- Extract key internal links from that page.
- Optionally check a small limited number of internal links for broken-link and basic status issues.
- Do not perform a full-site crawl in v1.

This keeps the product fast, safe, affordable, and easier to explain.

The UI must clearly say whether the report is for a single page or a limited website check. Do not imply full-site crawling if it is not performed.

Recommended wording:

Page audit with selected website health checks.

### 32.3 Limits for V1

Set sensible limits from the start.

Recommended limits:

- Maximum manual audits per website per hour.
- Maximum websites per user depending on plan or internal default.
- Maximum scheduled audit frequency.
- Maximum audit runtime.
- Maximum redirects followed.
- Maximum page size processed.
- Maximum internal links checked during basic link validation.

Even if payment plans are not built in v1, internal limits must exist to protect infrastructure.

### 32.4 Pricing and Plan Readiness

Do not overbuild subscriptions in v1 unless launch requires it.

However, the data model and business logic should be ready for plans later.

Minimum v1 plan logic:

- Support a default free/internal plan.
- Store user usage limits in a clean way.
- Track audit counts.
- Track website counts.
- Track scheduled audit usage.

Do not hardcode unlimited usage everywhere.

### 32.5 Report Quality Requirement

The report is the product.

The audit report must not be a raw dump from Lighthouse or any other tool. It must be normalised, prioritised, explained, and designed clearly.

Every important issue should answer:

- What is wrong?
- Why does it matter?
- How serious is it?
- What evidence was found?
- What should be fixed?

A user should be able to send the report to a client or developer without embarrassment.

### 32.6 Recommendation Quality Requirement

Recommendations must be practical and specific.

Bad recommendation:

Improve performance.

Good recommendation:

Large image files are slowing down the page. Compress oversized images, serve modern image formats, and lazy-load images that appear below the fold.

Avoid vague AI-style advice.

### 32.7 Safety Requirement

Web Audit must be safe by design.

For v1:

- Only perform non-invasive checks.
- Do not exploit vulnerabilities.
- Do not brute force anything.
- Do not crawl aggressively.
- Do not scan private networks.
- Do not attack login forms.
- Do not bypass robots or access controls.
- Do not pretend to be a penetration testing tool.

Security findings must be framed as basic security posture checks.

### 32.8 Audit Transparency Requirement

Every audit report should clearly show:

- Audited URL.
- Final resolved URL.
- Audit date and time.
- Device/profile used.
- Whether it was mobile or desktop audit.
- Whether it was single-page or limited-site audit.
- Audit duration.
- Any checks that failed or were skipped.

This makes the product more trustworthy.

### 32.9 Minimum Admin Requirement

A small internal admin/system page is necessary for v1 because audit jobs can fail.

It should show:

- Recent failed audits.
- Queue status.
- Average audit duration.
- Most common failure reasons.
- Recent worker errors.
- Basic usage totals.

This does not need to be a full admin panel.

### 32.10 Final V1 Exclusions

Do not include these in v1:

- AI auto-fixing.
- GitHub or GitLab pull request generation.
- Full-site crawling.
- Deep vulnerability scanning.
- Keyword rank tracking.
- Competitor comparison.
- Team workspaces.
- White-label client portals.
- Public marketplace features.
- Browser extension.
- Mobile app.
- Complex billing system unless launch requires paid access immediately.

These would dilute the v1 and increase delivery risk.

### 32.11 V1 Completion Standard

The v1 is ready only when a real user can:

1. Create an account.
2. Add a website.
3. Run a safe audit.
4. Wait while the audit runs in the background.
5. View a polished report.
6. Understand the main problems without technical confusion.
7. Export or share the report.
8. Schedule repeat audits.
9. See whether the website improved or degraded over time.

If this loop feels excellent, v1 is strong enough.

---

## 33. Final Instruction to Development Agent

Build Web Audit as a serious v1 product, not a demo.

Keep it lean, but make it feel complete.

The centre of the product is not complexity. The centre is the loop:

Add website, run audit, understand issues, export report, track improvement.

Everything else must support that loop.

Use the latest stable production practices, verify official documentation, select the best current packages, and implement the product with clean engineering discipline. Avoid unnecessary version locking, folder prescriptions, and fake enterprise bloat. Make it polished, secure, fast, safe, and ready for real users.
