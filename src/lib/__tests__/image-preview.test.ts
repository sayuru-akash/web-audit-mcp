import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchImagePreview, isPreviewableImageType } from "../image-preview";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

describe("image preview proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("allows common browser image types", () => {
    expect(isPreviewableImageType("image/png")).toBe(true);
    expect(isPreviewableImageType("image/svg+xml; charset=utf-8")).toBe(true);
    expect(isPreviewableImageType("text/html")).toBe(false);
  });

  it("fetches a bounded public image preview", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } })),
    );

    await expect(fetchImagePreview("https://example.com/logo.png")).resolves.toMatchObject({
      contentType: "image/png",
      finalUrl: "https://example.com/logo.png",
    });
  });

  it("rejects non-image responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html></html>", { headers: { "content-type": "text/html" } })));

    await expect(fetchImagePreview("https://example.com/not-image")).rejects.toThrow("not a previewable image");
  });

  it("rejects redirects to private targets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 302, headers: { location: "http://localhost:3000/logo.png" } })),
    );

    await expect(fetchImagePreview("https://example.com/logo.png")).rejects.toThrow("Enter a public website domain");
  });
});
