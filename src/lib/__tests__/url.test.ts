import { describe, expect, it, vi } from "vitest";
import { isPrivateIp, normalizeWebsiteUrl, safeRedirectTarget, sameOriginInternalLinks } from "../url";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

describe("url safety", () => {
  it("normalizes public website urls", () => {
    expect(normalizeWebsiteUrl("example.com/path#frag")).toMatchObject({
      normalizedUrl: "https://example.com/path",
      domain: "example.com",
    });
  });

  it("rejects unsupported protocols", () => {
    expect(() => normalizeWebsiteUrl("file:///etc/passwd")).toThrow("Only HTTP and HTTPS");
  });

  it("detects private addresses", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });

  it("keeps internal link checks same-origin and limited", () => {
    expect(
      sameOriginInternalLinks("https://example.com/a", ["/b", "https://other.com", "/c", "/d"], 2),
    ).toEqual(["https://example.com/b", "https://example.com/c"]);
  });

  it("resolves redirect targets against the current public url", async () => {
    await expect(safeRedirectTarget("https://example.com/a", "/next")).resolves.toMatchObject({
      normalizedUrl: "https://example.com/next",
    });
  });

  it("blocks redirects to local network targets", async () => {
    await expect(safeRedirectTarget("https://example.com/a", "http://localhost:3000")).rejects.toThrow(
      "Enter a public website domain",
    );
  });
});
