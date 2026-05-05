import * as cheerio from "cheerio";
import type { AuditCategory, Finding, Metric } from "@/lib/types";
import { id } from "@/lib/store";
import { assertPublicUrl, MAX_REDIRECTS, safeRedirectTarget, sameOriginInternalLinks } from "@/lib/url";
import { overallScore, scoreAll, severityRank } from "@/lib/scoring";

type AuditResult = {
  requestedUrl: string;
  finalUrl: string;
  durationMs: number;
  categoryScores: ReturnType<typeof scoreAll>;
  overallScore: number;
  findings: Omit<Finding, "id" | "auditRunId">[];
  metrics: Omit<Metric, "id" | "auditRunId">[];
};

type FetchedPage = {
  url: string;
  status: number;
  headers: Headers;
  html: string;
  durationMs: number;
  bytes: number;
  redirected: boolean;
  redirectChain: string[];
};

type SafeFetchResult = {
  response: Response;
  finalUrl: string;
  redirected: boolean;
  redirectChain: string[];
};

const USER_AGENT = "WebAuditBot/0.1 (+https://webaudit.local; safe non-invasive page audit)";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_LINK_CHECKS = 8;

function finding(
  category: AuditCategory,
  severity: Finding["severity"],
  title: string,
  description: string,
  evidence: string,
  impact: string,
  recommendation: string,
  status: Finding["status"] = "failed",
  technicalDetails?: string,
): Omit<Finding, "id" | "auditRunId"> {
  return {
    category,
    severity,
    status,
    title,
    description,
    evidence,
    impact,
    recommendation,
    technicalDetails,
    sortPriority: severityRank(severity) * 100,
  };
}

function metric(category: AuditCategory, key: string, label: string, value: string | number, unit?: string) {
  return { category, key, label, value, unit };
}

async function fetchOnce(url: string, method: "GET" | "HEAD" = "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function safeFetch(
  url: string,
  method: "GET" | "HEAD" = "GET",
  redirects = 0,
  chain: string[] = [],
): Promise<SafeFetchResult> {
  const safe = await assertPublicUrl(url);
  const response = await fetchOnce(safe.normalizedUrl, method);
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) throw new Error("The website returned a redirect without a Location header.");
    if (redirects >= MAX_REDIRECTS) throw new Error(`The URL exceeded the ${MAX_REDIRECTS} redirect limit.`);
    const target = await safeRedirectTarget(safe.normalizedUrl, location);
    const nextMethod = response.status === 303 ? "GET" : method;
    const next = await safeFetch(target.normalizedUrl, nextMethod, redirects + 1, [
      ...chain,
      `${response.status} ${safe.normalizedUrl} -> ${target.normalizedUrl}`,
    ]);
    return { ...next, redirected: true };
  }
  return { response, finalUrl: safe.normalizedUrl, redirected: redirects > 0, redirectChain: chain };
}

async function fetchPage(url: string): Promise<FetchedPage> {
  const started = performance.now();
  const { response, finalUrl, redirected, redirectChain } = await safeFetch(url);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error(`The URL returned ${contentType || "non-HTML content"}, not an HTML page.`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_HTML_BYTES) {
    throw new Error("The page HTML is larger than the v1 safety limit.");
  }
  return {
    url: finalUrl,
    status: response.status,
    headers: response.headers,
    html: buffer.toString("utf8"),
    durationMs: Math.round(performance.now() - started),
    bytes: buffer.byteLength,
    redirected,
    redirectChain,
  };
}

async function checkEndpoint(url: string): Promise<number | undefined> {
  try {
    const { response } = await safeFetch(url, "HEAD");
    return response.status;
  } catch {
    return undefined;
  }
}

async function checkLinks(links: string[]) {
  const results: { url: string; status?: number }[] = [];
  for (const link of links) {
    results.push({ url: link, status: await checkEndpoint(link) });
  }
  return results;
}

async function fetchTextCapped(url: string, maxBytes = 250_000): Promise<{ status?: number; text?: string }> {
  try {
    const { response } = await safeFetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    return { status: response.status, text: buffer.subarray(0, maxBytes).toString("utf8") };
  } catch {
    return {};
  }
}

function parseMaxAge(header: string): number | undefined {
  const match = /max-age=(\d+)/i.exec(header);
  return match ? Number(match[1]) : undefined;
}

function resolveSameOriginUrls(baseUrl: string, values: string[], limit: number): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  for (const value of values) {
    if (!value || value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("mailto:")) continue;
    try {
      const resolved = new URL(value, base);
      resolved.hash = "";
      if (resolved.origin === base.origin) seen.add(resolved.toString());
      if (seen.size >= limit) break;
    } catch {
      // Ignore malformed URLs; specific HTML/link checks surface user-facing issues.
    }
  }
  return [...seen];
}

export async function runPageAudit(inputUrl: string): Promise<AuditResult> {
  const safe = await assertPublicUrl(inputUrl);
  const page = await fetchPage(safe.normalizedUrl);
  const $ = cheerio.load(page.html);
  const findings: Omit<Finding, "id" | "auditRunId">[] = [];
  const metrics: Omit<Metric, "id" | "auditRunId">[] = [];

  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const h1s = $("h1").toArray();
  const headings = $("h1,h2,h3,h4,h5,h6")
    .toArray()
    .map((node) => node.tagName.toLowerCase());
  const images = $("img").toArray();
  const imagesMissingAlt = images.filter((node) => !($(node).attr("alt") ?? "").trim());
  const allLinks = $("a")
    .toArray()
    .map((node) => $(node).attr("href") ?? "")
    .filter(Boolean);
  const resourceCount =
    $("script[src]").length + $('link[rel="stylesheet"]').length + $("img[src]").length + $("iframe[src]").length;
  const viewport = $('meta[name="viewport"]').attr("content") ?? "";
  const canonical = $('link[rel="canonical"]').attr("href") ?? "";
  const robotsMeta = $('meta[name="robots"]').attr("content") ?? "";
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? "";
  const ogDescription = $('meta[property="og:description"]').attr("content") ?? "";
  const ogImage = $('meta[property="og:image"]').attr("content") ?? "";
  const ogUrl = $('meta[property="og:url"]').attr("content") ?? "";
  const twitterCard = $('meta[name="twitter:card"]').attr("content") ?? "";
  const structuredDataCount = $('script[type="application/ld+json"]').length;
  const duplicateIds = $("*[id]")
    .toArray()
    .map((node) => $(node).attr("id") ?? "")
    .filter((value, index, array) => value && array.indexOf(value) !== index);
  const missingAriaReferences = $("[aria-labelledby],[aria-describedby]")
    .toArray()
    .flatMap((node) => [$(node).attr("aria-labelledby"), $(node).attr("aria-describedby")])
    .filter(Boolean)
    .flatMap((value) => String(value).split(/\s+/))
    .filter((ref) => ref && $(`#${ref}`).length === 0);
  const unsafeBlankTargets = $('a[target="_blank"]')
    .toArray()
    .filter((node) => {
      const rel = ($(node).attr("rel") ?? "").toLowerCase();
      return !rel.includes("noopener") || !rel.includes("noreferrer");
    });
  const javascriptLinks = $("a[href]")
    .toArray()
    .filter((node) => ($(node).attr("href") ?? "").trim().toLowerCase().startsWith("javascript:"));
  const brokenHashLinks = $("a[href^='#']")
    .toArray()
    .filter((node) => {
      const hash = ($(node).attr("href") ?? "").slice(1);
      return hash && $(`#${hash}`).length === 0;
    });
  const assetUrls = resolveSameOriginUrls(
    page.url,
    [
      ...$("script[src]")
        .toArray()
        .map((node) => $(node).attr("src") ?? ""),
      ...$('link[rel="stylesheet"][href],link[rel="preload"][href],link[rel="icon"][href],link[rel="apple-touch-icon"][href]')
        .toArray()
        .map((node) => $(node).attr("href") ?? ""),
      ...$("img[src],iframe[src]")
        .toArray()
        .map((node) => $(node).attr("src") ?? ""),
    ],
    12,
  );
  const formControlsMissingLabels = $("input,select,textarea")
    .toArray()
    .filter((node) => {
      const el = $(node);
      const type = (el.attr("type") ?? "").toLowerCase();
      if (["hidden", "submit", "button"].includes(type)) return false;
      const idAttr = el.attr("id");
      return !el.attr("aria-label") && !el.attr("aria-labelledby") && (!idAttr || $(`label[for="${idAttr}"]`).length === 0);
    });
  const unnamedButtons = $("button,a")
    .toArray()
    .filter((node) => !$(node).text().trim() && !$(node).attr("aria-label") && !$(node).attr("title"));

  metrics.push(metric("technical", "http_status", "HTTP status", page.status));
  metrics.push(metric("technical", "html_size", "HTML size", Math.round(page.bytes / 1024), "KB"));
  metrics.push(metric("performance", "response_time", "Initial response", page.durationMs, "ms"));
  metrics.push(metric("technical", "redirect_hops", "Redirect hops", page.redirectChain.length));
  metrics.push(metric("performance", "content_encoding", "HTML content encoding", page.headers.get("content-encoding") ?? "none"));
  metrics.push(metric("performance", "resource_count", "Page resource references", resourceCount));
  metrics.push(metric("seo", "internal_links_seen", "Internal links detected", sameOriginInternalLinks(page.url, allLinks, 100).length));
  metrics.push(metric("accessibility", "images_missing_alt", "Images missing alt text", imagesMissingAlt.length));

  if (page.status >= 500) {
    findings.push(
      finding(
        "technical",
        "critical",
        "The page returned a server error",
        "The audited page responded with a server-side error.",
        `HTTP ${page.status}`,
        "Users and search engines may not be able to access the page reliably.",
        "Check server logs, upstream services, and deployment health before rerunning the audit.",
      ),
    );
  } else if (page.status >= 400) {
    findings.push(
      finding(
        "technical",
        "high",
        "The page returned a client error",
        "The audited URL did not return a successful HTML response.",
        `HTTP ${page.status}`,
        "Visitors may see an error page instead of the intended content.",
        "Confirm the URL, routing rules, and access controls for this page.",
      ),
    );
  }

  if (page.redirectChain.length >= 3) {
    findings.push(
      finding(
        "technical",
        "medium",
        "Redirect chain is longer than expected",
        "The page required several redirects before reaching the final URL.",
        `${page.redirectChain.length} redirect hop(s)`,
        "Long redirect chains add latency and can make canonical URL behavior harder to reason about.",
        "Reduce redirects and point links directly to the canonical final URL.",
        "failed",
        page.redirectChain.join("\n"),
      ),
    );
  }

  if (page.durationMs > 3000) {
    findings.push(
      finding(
        "performance",
        "high",
        "Initial response is slow",
        "The page took longer than expected to return the initial HTML.",
        `${page.durationMs}ms response time`,
        "Slow server response delays every later rendering step.",
        "Review backend latency, caching, database queries, and edge/CDN configuration.",
      ),
    );
  } else if (page.durationMs > 1200) {
    findings.push(
      finding(
        "performance",
        "medium",
        "Initial response can be faster",
        "The first HTML response is acceptable but has room for improvement.",
        `${page.durationMs}ms response time`,
        "Improving this helps the page start rendering sooner.",
        "Cache stable content and reduce work on the initial request path.",
      ),
    );
  }

  if (page.bytes > 600_000) {
    findings.push(
      finding(
        "performance",
        "medium",
        "HTML document is heavy",
        "The page sends a large HTML document before assets are loaded.",
        `${Math.round(page.bytes / 1024)}KB HTML`,
        "Large HTML increases network and parsing cost.",
        "Remove duplicated markup, defer non-critical content, and keep initial HTML lean.",
      ),
    );
  }
  if (page.bytes > 100_000 && !["br", "gzip", "zstd"].includes((page.headers.get("content-encoding") ?? "").toLowerCase())) {
    findings.push(
      finding(
        "performance",
        "medium",
        "HTML response is not compressed",
        "The page HTML is large enough that compression should normally be enabled.",
        `${Math.round(page.bytes / 1024)}KB HTML with no content-encoding`,
        "Compression reduces transfer size and improves load time on slower connections.",
        "Enable Brotli, gzip, or zstd compression at the server or CDN layer.",
      ),
    );
  }
  if (resourceCount > 120) {
    findings.push(
      finding(
        "performance",
        "medium",
        "The page references many resources",
        "A high number of scripts, styles, images, and frames can slow loading.",
        `${resourceCount} referenced resources`,
        "More requests increase network coordination and render delay.",
        "Bundle carefully, lazy-load below-the-fold media, and remove unused third-party assets.",
      ),
    );
  }

  if (!title) {
    findings.push(
      finding(
        "seo",
        "high",
        "Missing page title",
        "The page does not provide a title tag.",
        "No <title> tag found",
        "Search results and browser tabs may not describe the page clearly.",
        "Add a concise, unique title that names the page and brand.",
      ),
    );
  } else if (title.length < 15 || title.length > 70) {
    findings.push(
      finding(
        "seo",
        "low",
        "Page title length needs review",
        "The title exists but may be too short or too long for search result display.",
        `${title.length} characters`,
        "Search snippets may be unclear or truncated.",
        "Keep the title specific and usually within 15 to 70 characters.",
      ),
    );
  }

  if (!description) {
    findings.push(
      finding(
        "seo",
        "medium",
        "Missing meta description",
        "The page does not provide a meta description.",
        "No meta description found",
        "Search engines may generate a less useful snippet.",
        "Add a short, page-specific description that explains the value of the page.",
      ),
    );
  } else if (description.length < 50 || description.length > 170 || description.toLowerCase() === title.toLowerCase()) {
    findings.push(
      finding(
        "seo",
        description.toLowerCase() === title.toLowerCase() ? "medium" : "low",
        "Meta description quality needs review",
        "The meta description exists but may not work well as a search snippet.",
        `${description.length} characters`,
        "Weak snippets can reduce clarity when the page appears in search results.",
        "Write a specific description that is distinct from the title and usually 50 to 170 characters.",
      ),
    );
  }
  if (h1s.length !== 1) {
    findings.push(
      finding(
        "seo",
        h1s.length === 0 ? "medium" : "low",
        h1s.length === 0 ? "Missing H1 heading" : "Multiple H1 headings found",
        "The page should have one clear primary heading.",
        `${h1s.length} H1 headings`,
        "A clear heading structure helps readers and search engines understand the page.",
        "Use one H1 for the main topic and lower-level headings for sections.",
      ),
    );
  }
  if (!canonical) {
    findings.push(
      finding(
        "seo",
        "low",
        "Canonical URL is missing",
        "The page does not declare a canonical URL.",
        "No canonical link found",
        "Duplicate URL variants can split ranking signals.",
        "Add a canonical URL that points to the preferred page address.",
      ),
    );
  } else {
    try {
      const canonicalUrl = new URL(canonical, page.url);
      if (!["http:", "https:"].includes(canonicalUrl.protocol) || canonicalUrl.hash) {
        throw new Error("Canonical must be HTTP/HTTPS and should not include fragments.");
      }
      if (canonicalUrl.hostname !== new URL(page.url).hostname) {
        findings.push(
          finding(
            "seo",
            "low",
            "Canonical points to a different host",
            "The canonical URL points away from the audited host.",
            canonicalUrl.toString(),
            "Cross-domain canonicals can be correct, but accidental values can shift indexing signals elsewhere.",
            "Confirm the canonical URL is intentional and points to the preferred public page.",
          ),
        );
      }
    } catch (error) {
      findings.push(
        finding(
          "seo",
          "medium",
          "Canonical URL is invalid",
          "The page declares a canonical URL that could not be parsed safely.",
          canonical,
          "Invalid canonical metadata can confuse search engines.",
          "Use an absolute or resolvable HTTP/HTTPS canonical URL with no fragment.",
          "failed",
          error instanceof Error ? error.message : undefined,
        ),
      );
    }
  }
  if (!ogTitle || !ogDescription || !ogImage || !ogUrl || !twitterCard) {
    findings.push(
      finding(
        "seo",
        "low",
        "Social preview metadata is incomplete",
        "The page is missing one or more common Open Graph/Twitter preview tags.",
        [
          !ogTitle ? "og:title" : "",
          !ogDescription ? "og:description" : "",
          !ogImage ? "og:image" : "",
          !ogUrl ? "og:url" : "",
          !twitterCard ? "twitter:card" : "",
        ]
          .filter(Boolean)
          .join(", "),
        "Shared links may look weaker in social and messaging previews.",
        "Add Open Graph title, description, image, and URL metadata.",
      ),
    );
  }
  if (structuredDataCount === 0) {
    findings.push(
      finding(
        "seo",
        "info",
        "Structured data was not detected",
        "No JSON-LD structured data was found on the page.",
        "0 JSON-LD blocks",
        "Structured data can help search engines understand eligible rich result content.",
        "Add relevant schema only when it accurately describes the page.",
      ),
    );
  } else {
    const invalidJsonLd = $('script[type="application/ld+json"]')
      .toArray()
      .filter((node) => {
        try {
          JSON.parse($(node).text());
          return false;
        } catch {
          return true;
        }
      }).length;
    if (invalidJsonLd > 0) {
      findings.push(
        finding(
          "seo",
          "medium",
          "Structured data contains invalid JSON",
          "One or more JSON-LD blocks could not be parsed.",
          `${invalidJsonLd} invalid JSON-LD block(s)`,
          "Invalid structured data is ignored and may prevent rich result eligibility.",
          "Validate JSON-LD syntax and remove comments, trailing commas, or malformed escaping.",
        ),
      );
    }
  }

  if (imagesMissingAlt.length > 0) {
    findings.push(
      finding(
        "accessibility",
        imagesMissingAlt.length > 5 ? "high" : "medium",
        "Images are missing alternative text",
        "Some images do not include alt text.",
        `${imagesMissingAlt.length} image(s) without alt text`,
        "Screen reader users may miss meaningful visual content.",
        "Add concise alt text for meaningful images and empty alt text for decorative images.",
      ),
    );
  }
  if (formControlsMissingLabels.length > 0) {
    findings.push(
      finding(
        "accessibility",
        "high",
        "Form fields are missing labels",
        "Some form controls do not have programmatic labels.",
        `${formControlsMissingLabels.length} control(s) missing labels`,
        "Users of assistive technology may not know what information to enter.",
        "Connect each field to a visible label or an appropriate aria-label.",
      ),
    );
  }
  if (unnamedButtons.length > 0) {
    findings.push(
      finding(
        "accessibility",
        "medium",
        "Interactive elements need accessible names",
        "Some buttons or links have no readable text or accessible label.",
        `${unnamedButtons.length} unnamed interactive element(s)`,
        "Keyboard and screen reader users may not understand the action.",
        "Add visible text, aria-labels, or titles that describe each action.",
      ),
    );
  }
  if (!$("html").attr("lang")) {
    findings.push(
      finding(
        "accessibility",
        "medium",
        "Document language is missing",
        "The initial HTML does not set a language on the html element.",
        "Missing html[lang]",
        "Assistive technologies may use the wrong pronunciation rules.",
        "Set the primary page language, for example <html lang=\"en\">.",
      ),
    );
  }
  if ($("main").length === 0) {
    findings.push(
      finding(
        "accessibility",
        "low",
        "Main landmark is missing in initial HTML",
        "The initial HTML does not include a main landmark.",
        "No <main> element found",
        "Landmarks help keyboard and screen reader users jump to the primary content.",
        "Wrap the primary page content in a semantic <main> element.",
      ),
    );
  }
  if (duplicateIds.length > 0 || missingAriaReferences.length > 0) {
    findings.push(
      finding(
        "accessibility",
        "medium",
        "ARIA or ID references need review",
        "The page has duplicate IDs or ARIA references that point to missing elements.",
        `${duplicateIds.length} duplicate ID(s), ${missingAriaReferences.length} missing ARIA reference(s)`,
        "Broken references can make labels and descriptions unavailable to assistive technology.",
        "Ensure IDs are unique and aria-labelledby/aria-describedby values point to existing elements.",
      ),
    );
  }
  for (let index = 1; index < headings.length; index += 1) {
    const previous = Number(headings[index - 1].slice(1));
    const current = Number(headings[index].slice(1));
    if (current - previous > 1) {
      findings.push(
        finding(
          "accessibility",
          "low",
          "Heading levels skip structure",
          "The page jumps across heading levels.",
          `${headings[index - 1]} followed by ${headings[index]}`,
          "Skipped heading levels make the document harder to navigate.",
          "Keep heading levels in a logical order without skipping section depth.",
        ),
      );
      break;
    }
  }
  findings.push(
    finding(
      "accessibility",
      "info",
      "Automated accessibility coverage is limited",
      "This audit checks common machine-detectable issues only.",
      "Manual review still required",
      "Automated checks cannot confirm every keyboard, screen reader, or cognitive accessibility issue.",
      "Use this report as a first pass, then validate key journeys manually.",
      "passed",
    ),
  );

  const headers = page.headers;
  const isHttps = page.url.startsWith("https://");
  if (!isHttps) {
    findings.push(
      finding(
        "security",
        "high",
        "The final page is not served over HTTPS",
        "The audit ended on an insecure HTTP URL.",
        page.url,
        "Visitors may be exposed to interception or browser trust warnings.",
        "Serve the page over HTTPS and redirect HTTP requests to HTTPS.",
      ),
    );
  }
  const securityHeaders: [string, string, Finding["severity"]][] = [
    ["strict-transport-security", "HSTS header is missing", "medium"],
    ["content-security-policy", "Content Security Policy is missing", "medium"],
    ["x-frame-options", "Frame protection header is missing", "low"],
    ["referrer-policy", "Referrer Policy is missing", "low"],
    ["permissions-policy", "Permissions Policy is missing", "low"],
  ];
  for (const [header, titleText, severity] of securityHeaders) {
    if (!headers.get(header)) {
      findings.push(
        finding(
          "security",
          severity,
          titleText,
          `The ${header} response header was not found.`,
          `Missing ${header}`,
          "Security headers reduce common browser-side risk and data exposure.",
          "Add the header with a policy suited to this application and test it in report-only mode where appropriate.",
        ),
      );
    }
  }
  const hsts = headers.get("strict-transport-security") ?? "";
  const csp = headers.get("content-security-policy") ?? "";
  const xFrame = (headers.get("x-frame-options") ?? "").toLowerCase();
  const referrerPolicy = (headers.get("referrer-policy") ?? "").toLowerCase();
  if (hsts && (parseMaxAge(hsts) ?? 0) < 15_552_000) {
    findings.push(
      finding(
        "security",
        "low",
        "HSTS max-age is short",
        "The HSTS header exists but uses a short max-age value.",
        hsts,
        "Short HSTS windows reduce protection against protocol downgrade after the value expires.",
        "Use a longer max-age after confirming HTTPS is stable across the domain.",
      ),
    );
  }
  if (csp && /'unsafe-inline'|'unsafe-eval'|\*/i.test(csp)) {
    findings.push(
      finding(
        "security",
        "low",
        "Content Security Policy is permissive",
        "The CSP includes unsafe or wildcard directives.",
        csp.slice(0, 220),
        "Permissive policies reduce the protection CSP can provide against script injection.",
        "Tighten script/style directives and use nonces or hashes where practical.",
      ),
    );
  }
  if (xFrame && !["deny", "sameorigin"].includes(xFrame)) {
    findings.push(
      finding(
        "security",
        "low",
        "Frame protection header value is unusual",
        "X-Frame-Options is present but does not use DENY or SAMEORIGIN.",
        xFrame,
        "Unexpected values may not be honored consistently by browsers.",
        "Use DENY or SAMEORIGIN, or enforce frame-ancestors in CSP.",
      ),
    );
  }
  if (referrerPolicy === "unsafe-url") {
    findings.push(
      finding(
        "security",
        "medium",
        "Referrer Policy leaks full URLs",
        "The page uses the unsafe-url referrer policy.",
        referrerPolicy,
        "Full URLs, including paths and query strings, may be sent to other origins.",
        "Use a stricter policy such as strict-origin-when-cross-origin.",
      ),
    );
  }

  if (!viewport) {
    findings.push(
      finding(
        "mobile",
        "high",
        "Viewport meta tag is missing",
        "The page does not declare a responsive viewport.",
        "No viewport meta tag found",
        "Mobile browsers may render the page at desktop width.",
        "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
      ),
    );
  } else if (!viewport.includes("width=device-width")) {
    findings.push(
      finding(
        "mobile",
        "medium",
        "Viewport configuration needs review",
        "The viewport tag exists but does not include width=device-width.",
        viewport,
        "The layout may not adapt correctly on phones.",
        "Use a responsive viewport and verify key pages on small screens.",
      ),
    );
  }
  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(viewport)) {
    findings.push(
      finding(
        "mobile",
        "medium",
        "Mobile zoom may be restricted",
        "The viewport configuration appears to limit user zoom.",
        viewport,
        "Users with low vision may need pinch zoom to read content comfortably.",
        "Avoid disabling zoom or setting maximum-scale=1.",
      ),
    );
  }

  const robotsUrl = new URL("/robots.txt", page.url).toString();
  const sitemapUrl = new URL("/sitemap.xml", page.url).toString();
  const [robotsResult, sitemapResult] = await Promise.all([fetchTextCapped(robotsUrl), fetchTextCapped(sitemapUrl)]);
  metrics.push(metric("seo", "robots_status", "robots.txt status", robotsResult.status ?? "unreachable"));
  metrics.push(metric("seo", "sitemap_status", "sitemap.xml status", sitemapResult.status ?? "unreachable"));
  const robotsStatus = robotsResult.status;
  const sitemapStatus = sitemapResult.status;
  if (!robotsStatus || robotsStatus >= 400) {
    findings.push(
      finding(
        "seo",
        "low",
        "robots.txt was not available",
        "The domain did not return a successful robots.txt response.",
        `Status ${robotsStatus ?? "unreachable"}`,
        "Search engines may still crawl the site, but crawl rules are less explicit.",
        "Add a simple robots.txt file and reference the sitemap when available.",
      ),
    );
  }
  if (!sitemapStatus || sitemapStatus >= 400) {
    findings.push(
      finding(
        "seo",
        "low",
        "sitemap.xml was not available",
        "The domain did not return a successful sitemap.xml response.",
        `Status ${sitemapStatus ?? "unreachable"}`,
        "Search engines may discover pages less efficiently.",
        "Publish a sitemap and reference it from robots.txt.",
      ),
    );
  }
  if (robotsStatus && robotsStatus < 400 && robotsResult.text) {
    if (/^\s*disallow:\s*\/\s*$/im.test(robotsResult.text)) {
      findings.push(
        finding(
          "seo",
          "medium",
          "robots.txt may block the full site",
          "robots.txt contains a global Disallow: / rule.",
          "Disallow: /",
          "If this applies to all user agents, search engines may avoid crawling the site.",
          "Confirm robots.txt rules are intentional for production pages.",
        ),
      );
    }
    if (!/^\s*sitemap:/im.test(robotsResult.text)) {
      findings.push(
        finding(
          "seo",
          "low",
          "robots.txt does not reference a sitemap",
          "robots.txt is reachable but does not include a Sitemap directive.",
          "No Sitemap directive found",
          "A sitemap reference can help crawlers discover canonical sitemap locations.",
          "Add a Sitemap directive when a sitemap is available.",
        ),
      );
    }
  }
  if (sitemapStatus && sitemapStatus < 400 && sitemapResult.text && !/<(urlset|sitemapindex)[\s>]/i.test(sitemapResult.text)) {
    findings.push(
      finding(
        "seo",
        "medium",
        "sitemap.xml content does not look like a sitemap",
        "The sitemap URL responded successfully, but the body does not look like a sitemap index or URL set.",
        "Missing urlset/sitemapindex root",
        "Search engines may ignore malformed sitemap content.",
        "Return valid XML sitemap content or point robots.txt to the correct sitemap.",
      ),
    );
  }

  if (unsafeBlankTargets.length > 0 || javascriptLinks.length > 0 || brokenHashLinks.length > 0) {
    findings.push(
      finding(
        "technical",
        unsafeBlankTargets.length > 0 ? "medium" : "low",
        "Link hygiene needs review",
        "The page has unsafe blank-target links, javascript links, or hash links without matching targets.",
        `${unsafeBlankTargets.length} unsafe blank target(s), ${javascriptLinks.length} javascript link(s), ${brokenHashLinks.length} broken hash link(s)`,
        "Weak link hygiene can create security, accessibility, and navigation issues.",
        "Add rel=\"noopener noreferrer\" to new-tab links, avoid javascript: links, and ensure hash targets exist.",
      ),
    );
  }

  if (page.url.startsWith("https://")) {
    const insecureAssets = [
      ...$("[src^='http://']")
        .toArray()
        .map((node) => $(node).attr("src") ?? ""),
      ...$("[href^='http://']")
        .toArray()
        .map((node) => $(node).attr("href") ?? ""),
    ];
    if (insecureAssets.length > 0) {
      findings.push(
        finding(
          "security",
          "high",
          "Potential mixed content detected",
          "The HTTPS page references HTTP resources in the initial HTML.",
          `${insecureAssets.length} insecure resource reference(s)`,
          "Mixed content can be blocked by browsers or weaken page security.",
          "Serve all page resources over HTTPS.",
          "failed",
          insecureAssets.slice(0, 10).join("\n"),
        ),
      );
    }
  }

  if (!/^<!doctype html>/i.test(page.html.trim()) || $("title").length > 1 || $('meta[name="viewport"]').length > 1) {
    findings.push(
      finding(
        "technical",
        "low",
        "HTML document structure needs review",
        "The initial HTML is missing a standard doctype or has duplicate key metadata.",
        `doctype=${/^<!doctype html>/i.test(page.html.trim())}, titles=${$("title").length}, viewports=${$('meta[name="viewport"]').length}`,
        "Malformed or duplicated document metadata can create inconsistent browser behavior.",
        "Use one doctype, one title, and one viewport declaration in the initial HTML.",
      ),
    );
  }

  const assetResults = await checkLinks(assetUrls);
  const brokenAssets = assetResults.filter((result) => !result.status || result.status >= 400);
  metrics.push(metric("technical", "checked_assets", "Same-origin assets checked", assetResults.length));
  if (brokenAssets.length > 0) {
    findings.push(
      finding(
        "technical",
        "medium",
        "Some same-origin assets failed",
        "A limited same-origin asset check found scripts, styles, images, or icons that failed.",
        `${brokenAssets.length} of ${assetResults.length} checked assets failed`,
        "Broken assets can harm rendering, tracking, interaction, or brand presentation.",
        "Fix, remove, or redirect failing asset URLs.",
        "failed",
        brokenAssets.map((item) => `${item.status ?? "unreachable"} ${item.url}`).join("\n"),
      ),
    );
  }

  const linksToCheck = sameOriginInternalLinks(page.url, allLinks, MAX_LINK_CHECKS);
  const linkResults = await checkLinks(linksToCheck);
  const broken = linkResults.filter((result) => !result.status || result.status >= 400);
  metrics.push(metric("technical", "checked_internal_links", "Internal links checked", linkResults.length));
  if (broken.length > 0) {
    findings.push(
      finding(
        "technical",
        "medium",
        "Some internal links did not respond successfully",
        "A limited same-origin link check found links that failed or returned errors.",
        `${broken.length} of ${linkResults.length} checked links failed`,
        "Broken links create dead ends for visitors and search crawlers.",
        "Fix or redirect the failing internal URLs.",
        "failed",
        broken.map((item) => `${item.status ?? "unreachable"} ${item.url}`).join("\n"),
      ),
    );
  }

  if (robotsMeta.toLowerCase().includes("noindex")) {
    findings.push(
      finding(
        "seo",
        "critical",
        "The page is marked noindex",
        "The page tells search engines not to index it.",
        robotsMeta,
        "If unintended, this can remove the page from search results.",
        "Remove noindex from production pages that should appear in search.",
      ),
    );
  }

  if (findings.length === 0) {
    findings.push(
      finding(
        "technical",
        "info",
        "No major automated issues found",
        "The page passed the v1 automated checks.",
        "Safe page audit completed",
        "Continue monitoring because regressions can appear after deployments.",
        "Schedule a recurring audit and perform manual review for deeper quality checks.",
        "passed",
      ),
    );
  }

  const sortedFindings = findings
    .map((item, index) => ({ ...item, sortPriority: item.sortPriority + index }))
    .sort((a, b) => a.sortPriority - b.sortPriority);
  const concreteFindings = sortedFindings.map((item) => ({ ...item, id: id(), auditRunId: "preview" }));
  const categoryScores = scoreAll(concreteFindings);
  return {
    requestedUrl: safe.normalizedUrl,
    finalUrl: page.url,
    durationMs: page.durationMs,
    findings: sortedFindings,
    metrics,
    categoryScores,
    overallScore: overallScore(categoryScores),
  };
}
