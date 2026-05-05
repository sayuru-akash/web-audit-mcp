# Web Audit — DESIGN.md

## 1. Design Goal

Web Audit should feel clean, sharp, technical, and trustworthy.

It is not a playful app.
It is not a noisy analytics dashboard.
It is a professional audit product that makes website problems easy to understand.

The interface should feel calm even when the report contains serious issues.

## 2. Design Principles

### Clear before clever

Every screen should make the next action obvious.

### Report-first

The audit report is the main product experience.
It must feel polished enough to send to a client.

### Calm density

Show useful information without packing the screen.

### Business-readable, developer-useful

A founder should understand the issue.
A developer should know what to fix.

### Honest confidence

Do not make weak checks look more important than they are.
Do not exaggerate severity.

## 3. Visual Personality

Keywords:

- minimal
- modern
- professional
- calm
- precise
- premium
- technical
- trustworthy

Avoid:

- loud gradients
- childish icons
- messy cards
- dashboard clutter
- over-coloured charts
- huge blocks of text
- generic SaaS template feel

## 4. Layout Style

Use a clean SaaS dashboard layout.

Recommended structure:

- left sidebar on desktop
- top bar with page context and actions
- responsive mobile navigation
- wide report content area
- card-based sections
- strong spacing
- clear hierarchy

Desktop matters most, but mobile must still work properly.

## 5. Colour Direction

Use a restrained palette.

Recommended base:

- near-white background
- deep charcoal text
- muted grey borders
- soft card backgrounds
- one primary accent
- clear severity colours

Severity colours should be easy to understand:

- Critical: red
- High: orange/red
- Medium: amber
- Low: blue/grey
- Info: grey/blue
- Passed: green

Use colour as a signal, not decoration.

Dark mode should feel premium, not just inverted.

## 6. Typography

Use a clean modern sans-serif.

Tone:

- crisp headings
- readable body text
- clear metric labels
- strong numbers
- short descriptions

Avoid long paragraphs inside the UI.

Recommended text rhythm:

- headings: short
- issue descriptions: 1–2 sentences
- recommendations: direct and practical
- technical evidence: expandable where possible

## 7. Core Navigation

Main navigation:

- Dashboard
- Websites
- Audits
- Notifications
- Settings

Admin/system health can be hidden or role-based.

Keep navigation simple.

## 8. Landing Page

Goal:

Get the user to understand the product fast and add a website.

Sections:

1. Hero
2. URL input or CTA
3. Audit categories
4. Example report preview
5. Use cases
6. Final CTA

Hero direction:

**Know what is broken. Fix what matters.**

Supporting line:

Audit performance, SEO, accessibility, security basics, and technical health in one clean report.

Primary CTA:

**Run your first audit**

Secondary CTA:

**View sample report**

Keep the landing page sharp and not too long.

## 9. Dashboard

Dashboard should show:

- total websites
- latest audit status
- average score
- critical issues
- recent audits
- websites needing attention

Do not overload it.

Primary CTA:

**Add website**

Secondary CTA:

**Run audit**

Empty state:

No websites added yet.
Add your first website and run a clean audit in minutes.

## 10. Website List

Each website card/row should show:

- favicon
- website name
- domain
- latest overall score
- last audit date
- critical/high issue count
- schedule status
- run audit action

Use cards for small lists.
Use table layout when many websites exist.

## 11. Add Website Screen

Keep it simple.

Fields:

- Website URL
- Website name optional

After URL entry:

- validate
- normalise
- show clear error if unsafe/invalid
- offer to run first audit

Do not ask for too much.

## 12. Audit Progress

Audit progress should feel alive and reliable.

Show steps:

- Preparing audit
- Loading page
- Checking performance
- Checking SEO
- Checking accessibility
- Checking security basics
- Building report

Use calm loading states.

Avoid fake precision if progress is not exact.

Good wording:

We are checking the page now. Some audits may take a little longer depending on the website.

## 13. Audit Report Layout

The report should be the nicest screen in the product.

Recommended order:

1. Report header
2. Overall score
3. Category score cards
4. Top issues
5. Metrics summary
6. Findings by category
7. Passed checks
8. Audit details
9. Export/share actions

## 14. Report Header

Show:

- website name
- audited URL
- final URL
- audit date/time
- audit profile
- export button
- share button if enabled

Keep this clean and compact.

## 15. Overall Score

Use a strong score card.

Show:

- score number
- health label
- comparison with previous audit if available
- short summary

Score labels:

- 90–100: Excellent
- 75–89: Good
- 60–74: Needs work
- 40–59: Poor
- 0–39: Critical

Use labels carefully.
Do not overdramatise.

## 16. Category Cards

Show six cards:

- Performance
- SEO
- Accessibility
- Security Basics
- Technical Health
- Mobile Readiness

Each card should show:

- score
- short status
- issue count
- click/anchor to section

Cards must be clean and scannable.

## 17. Issues

Issue cards should include:

- severity badge
- title
- short explanation
- impact
- recommendation
- evidence
- expandable technical details

Keep collapsed cards short.

Do not show raw tool output by default.

## 18. Severity Design

Critical:

- visually strong
- appears first
- direct wording

High:

- important but less alarming

Medium:

- useful improvement

Low:

- minor

Info:

- neutral observation

The order of issues matters more than quantity.

## 19. Recommendations

Recommendations must feel practical.

Format:

- what to fix
- why it matters
- how to fix it

Keep wording short.

Example:

Large images are slowing down the page.
Compress oversized images, use modern formats, and lazy-load images below the fold.

## 20. Evidence

Evidence should be clear.

Examples:

- measured value
- affected URL
- missing tag
- failing header
- failed request
- screenshot if useful

Show technical evidence in an expandable area when it is long.

## 21. Trends

Trend charts should be simple.

Show:

- overall score over time
- category scores over time
- previous vs latest score
- issue count movement

Avoid complex analytics.

Charts should be readable without needing explanation.

## 22. PDF Report

The PDF must look professional.

It should include:

- cover/header
- website details
- overall score
- category scores
- top issues
- detailed findings
- recommendations
- audit transparency details
- disclaimer

PDF design should be lighter than the dashboard.
No messy backgrounds.
No cramped text.

## 23. Share Report Page

If implemented, shared reports should be read-only.

Do not expose:

- user email
- account settings
- private dashboard data
- unrelated websites

Shared report should feel like a polished client deliverable.

## 24. Notifications

Notification style:

- simple
- calm
- clear
- action-focused

Types:

- audit completed
- audit failed
- score dropped
- critical issue found

Each notification should link to the relevant report or website.

## 25. Settings

Keep settings minimal.

Sections:

- Profile
- Security
- Notifications
- Theme
- Account deletion

No clutter.

## 26. Admin/System Health

Internal only.

Show:

- failed audits
- queue status
- average audit duration
- common failure reasons
- recent worker errors
- usage totals

This screen can be functional before it is beautiful, but it must be readable.

## 27. Empty States

Empty states should guide action.

### No Websites

No websites added yet.
Add your first website and run a clean audit in minutes.

Button:

Add website

### No Audits

No audits yet.
Run your first audit to see what needs attention.

Button:

Run audit

### No Critical Issues

No critical issues found.
Review the remaining recommendations to keep improving the page.

## 28. Error States

Errors should be human.

Bad:

Job failed.

Good:

We could not complete this audit because the website did not respond in time. Please try again.

Common error states:

- invalid URL
- unsafe URL blocked
- website unreachable
- audit timeout
- worker failure
- report not found
- unauthorised access

## 29. Loading States

Use skeletons for:

- dashboard cards
- website list
- report sections
- issue cards

Use progress states for audits.

Avoid blank screens.

## 30. Responsive Behaviour

Desktop:

- sidebar layout
- wider report sections
- tables where useful
- charts visible

Tablet:

- compact sidebar or top nav
- two-column cards

Mobile:

- single-column layout
- sticky primary actions where useful
- readable cards
- no cramped tables

Reports must be readable on mobile.

## 31. Component Style

Core components:

- button
- input
- select
- badge
- card
- table
- modal
- drawer
- toast
- tabs
- accordion
- score card
- issue card
- metric card
- chart card
- empty state
- error state
- audit progress

Keep component styles consistent.

## 32. Motion

Use light motion only.

Good uses:

- button feedback
- card hover
- progress step transitions
- drawer/modal entrance
- score change highlight

Avoid:

- dramatic animations
- slow transitions
- motion that delays work

## 33. Accessibility

Design must support:

- keyboard navigation
- visible focus
- readable contrast
- labelled inputs
- accessible charts
- non-colour severity labels
- proper heading order

Charts and colours must not be the only way to understand status.

## 34. Microcopy Tone

Tone:

- clear
- calm
- direct
- professional

Avoid:

- fearmongering
- vague AI phrasing
- fake urgency
- overly technical language in main summaries

Examples:

Audit completed. Your report is ready.

A critical issue was found and should be reviewed first.

This audit checks the submitted page with selected website health checks.

## 35. Quality Bar

The UI is good enough when:

- the dashboard feels calm
- the report feels client-ready
- issue priority is obvious
- recommendations are readable
- empty states are useful
- errors are understandable
- mobile does not feel broken
- dark mode looks intentional
- the product does not look like a template

## 36. Final Design Rule

Make Web Audit feel like a serious tool.

Minimal does not mean empty.
Professional does not mean boring.
Technical does not mean confusing.

The best screen in the product must be the audit report.
