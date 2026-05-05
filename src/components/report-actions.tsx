"use client";

import { Check, Copy, Download, ExternalLink, Link2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { createShareAction, revokeShareAction } from "@/lib/actions";

export function ReportActions({
  auditId,
  websiteDomain,
  shareUrl,
  shareCreated,
}: {
  auditId: string;
  websiteDomain: string;
  shareUrl?: string;
  shareCreated?: boolean;
}) {
  const [message, setMessage] = useState<string>();
  const [shareOpen, setShareOpen] = useState(Boolean(shareCreated && shareUrl));
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function exportPdf() {
    setMessage("Preparing PDF...");
    try {
      const response = await fetch(`/api/audits/${auditId}/pdf`, { credentials: "same-origin" });
      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.includes("application/pdf")) {
        const text = await response.text();
        throw new Error(text || `PDF export failed with HTTP ${response.status}.`);
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `web-audit-${websiteDomain}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      setMessage("PDF downloaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PDF export failed.");
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <div className="actions">
        <button className="primary" type="button" onClick={exportPdf}>
          <Download size={16} /> Export PDF
        </button>
        {shareUrl ? (
          <button type="button" onClick={() => setShareOpen(true)}>
            <Link2 size={16} /> Share link
          </button>
        ) : (
          <form
            action={(formData) => {
              startTransition(() => createShareAction(formData));
            }}
          >
            <input type="hidden" name="auditId" value={auditId} />
            <button type="submit" disabled={isPending}>
              <Link2 size={16} /> {isPending ? "Creating..." : "Create share link"}
            </button>
          </form>
        )}
        {message ? <span className="inline-status">{message}</span> : null}
      </div>

      {shareOpen && shareUrl ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShareOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="share-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="share-title">Private share link</h2>
                <p className="muted">Anyone with this link can view this audit report only.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShareOpen(false)} aria-label="Close share dialog">
                <X size={17} />
              </button>
            </div>
            <div className="copy-row">
              <input readOnly value={shareUrl} aria-label="Share URL" />
              <button type="button" onClick={copyShareUrl}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="actions">
              <a className="button" href={shareUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Open
              </a>
              <form
                action={(formData) => {
                  startTransition(() => revokeShareAction(formData));
                }}
              >
                <input type="hidden" name="auditId" value={auditId} />
                <button className="danger" type="submit" disabled={isPending}>
                  Revoke link
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
