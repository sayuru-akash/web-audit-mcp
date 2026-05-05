import * as cheerio from "cheerio";
import type { AuditCategory, Finding, Metric } from "@/lib/types";
import { id } from "@/lib/store";
import { assertPublicUrl, sameOriginInternalLinks } from "@/lib/url";
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

async function fetchWithTimeout(url: string, method: "GET" | "HEAD" = "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPage(url: string): Promise<FetchedPage> {
  const started = performance.now();
  const response = await fetchWithTimeout(url);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error(`The URL returned ${contentType || "non-HTML content"}, not an HTML page.`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_HTML_BYTES) {
    throw new Error("The page HTML is larger than the v1 safety limit.");
  }
  return {
    url: response.url,
    status: response.status,
    headers: response.headers,
    html: buffer.toString("utf8"),
    durationMs: Math.round(performance.now() - started),
    bytes: buffer.byteLength,
    redirected: response.redirected,
  };
}

async function checkEndpoint(url: string): Promise<number | undefined> {
  try {
    const response = await fetchWithTimeout(url, "HEAD");
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
  const structuredDataCount = $('script[type="application/ld+json"]').length;
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
  }
  if (!ogTitle) {
    findings.push(
      finding(
        "seo",
        "low",
        "Social preview metadata is incomplete",
        "The page does not include a basic Open Graph title.",
        "Missing og:title",
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

  const robotsUrl = new URL("/robots.txt", page.url).toString();
  const sitemapUrl = new URL("/sitemap.xml", page.url).toString();
  const [robotsStatus, sitemapStatus] = await Promise.all([checkEndpoint(robotsUrl), checkEndpoint(sitemapUrl)]);
  metrics.push(metric("seo", "robots_status", "robots.txt status", robotsStatus ?? "unreachable"));
  metrics.push(metric("seo", "sitemap_status", "sitemap.xml status", sitemapStatus ?? "unreachable"));
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
