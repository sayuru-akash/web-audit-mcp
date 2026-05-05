import { afterEach, describe, expect, it, vi } from "vitest";
import { runPageAudit } from "../audit-engine";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "104.18.1.1", family: 4 }]),
}));

describe("audit engine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps Cloudflare-managed asset failures as manual-review findings", async () => {
    const html = `<!doctype html>
      <html lang="en">
        <head>
          <title>Codezela</title>
          <meta name="description" content="A production software team.">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="canonical" href="https://codezela.com/">
          <script src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>
        </head>
        <body><h1>Codezela</h1><a href="/about">About</a></body>
      </html>`;
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const target = String(url);
      const method = init?.method ?? "GET";
      if (target === "https://codezela.com/") {
        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "strict-transport-security": "max-age=31536000",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "content-security-policy": "default-src 'self'",
          },
        });
      }
      if (target.includes("/cdn-cgi/scripts/") && (method === "HEAD" || method === "GET")) {
        return new Response("", { status: 404 });
      }
      return new Response("", { status: 200, headers: { "content-type": "text/plain" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runPageAudit("https://codezela.com");

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "needs_review",
          title: "Platform-managed assets need manual verification",
        }),
      ]),
    );
    expect(result.findings).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: "Some same-origin assets are confirmed failing" })]),
    );
  });
});
