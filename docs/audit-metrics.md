# Audit Metrics

Metrics are compact signals stored with every completed audit. Findings explain what to fix; metrics explain what was measured.
Findings can also store `technicalDetails` with capped element examples, checked URLs, or header values. The report UI renders those details in evidence dialogs with copy support and image previews when image URLs are present.

## Score Outputs

| Output | Meaning |
| --- | --- |
| `overallScore` | Weighted summary across all categories, 0 to 100. |
| `categoryScores.performance` | HTML response and document weight signals. |
| `categoryScores.seo` | Search metadata, indexing, robots, sitemap, and structured data signals. |
| `categoryScores.accessibility` | Automated accessibility first-pass checks. |
| `categoryScores.security` | HTTPS, security headers, mixed content, and unsafe policy signals. |
| `categoryScores.technical` | HTTP status, redirects, document structure, links, and assets. |
| `categoryScores.mobile` | Viewport and zoom-readiness signals. |

## Stored Metric Keys

| Key | Category | Unit | Meaning |
| --- | --- | --- | --- |
| `http_status` | Technical | none | HTTP status returned by the final audited HTML page. |
| `html_size` | Technical | KB | Initial HTML response size after fetch limits are applied. |
| `response_time` | Performance | ms | Time to receive the initial HTML response. |
| `redirect_hops` | Technical | count | Number of validated redirect hops before the final page. |
| `content_encoding` | Performance | none | Final HTML response `content-encoding`, or `none`. |
| `resource_count` | Performance | count | Number of script, stylesheet, image, iframe, preload, and icon references found in the initial HTML. |
| `internal_links_seen` | SEO | count | Same-origin internal links detected in the initial HTML, capped for reporting. |
| `images_missing_alt` | Accessibility | count | Images in the initial HTML without an `alt` attribute. |
| `robots_status` | SEO | none | Fetch status for `/robots.txt`, or `unreachable`. |
| `sitemap_status` | SEO | none | Fetch status for `/sitemap.xml`, or `unreachable`. |
| `checked_assets` | Technical | count | Same-origin assets checked for basic response health. |
| `assets_needing_manual_review` | Technical | count | Same-origin provider-managed assets that failed automated verification but should be manually confirmed in a browser. |
| `checked_internal_links` | Technical | count | Same-origin internal links checked for basic response health. |

## Coverage Boundary

These metrics are intentionally server-side and non-invasive. They do not include Lighthouse lab metrics, browser rendering timings, JavaScript execution traces, crawl-depth metrics, keyword rank data, or vulnerability scanner outputs.

Findings use four statuses:

| Status | Meaning |
| --- | --- |
| `failed` | Confirmed automated issue and counted in scoring. |
| `needs_review` | Automation found a signal that may be conditional, provider-managed, or browser-context dependent; visible in reports but not scored as a failure. |
| `passed` | Positive automated confirmation. |
| `skipped` | Check was intentionally not run or not applicable. |
