"use client";

import { Copy, Search, X } from "lucide-react";
import { useId, useState } from "react";
import type { Finding } from "@/lib/types";

type EvidenceFinding = Pick<
  Finding,
  "category" | "description" | "evidence" | "impact" | "recommendation" | "severity" | "status" | "technicalDetails" | "title"
>;

function evidenceUrls(finding: EvidenceFinding) {
  const text = `${finding.evidence}\n${finding.technicalDetails ?? ""}`;
  const matches = text.match(/https?:\/\/[^\s"'<>|)]+/g) ?? [];
  return [
    ...new Set(
      matches
        .map((url) => url.replace(/[.,;]+$/, ""))
        .filter((url) => {
          try {
            const parsed = new URL(url);
            return parsed.hostname.includes(".") && !url.includes("...");
          } catch {
            return false;
          }
        }),
    ),
  ].slice(0, 12);
}

function isLikelyImageUrl(url: string) {
  return /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(url) || /\/image\/upload\//i.test(url);
}

export function FindingEvidenceButton({ finding }: { finding: EvidenceFinding }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const titleId = useId();
  const urls = evidenceUrls(finding);
  const imageUrls = urls.filter(isLikelyImageUrl).slice(0, 8);
  const copyText = [
    finding.title,
    `Severity: ${finding.severity}`,
    `Status: ${finding.status.replace("_", " ")}`,
    `Category: ${finding.category}`,
    "",
    "Evidence",
    finding.evidence,
    "",
    "Impact",
    finding.impact,
    "",
    "Recommendation",
    finding.recommendation,
    finding.technicalDetails ? `\nTechnical details\n${finding.technicalDetails}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  async function copyEvidence() {
    try {
      await navigator.clipboard.writeText(copyText);
      setMessage("Evidence copied.");
    } catch {
      setMessage("Copy was blocked. Select the evidence text and copy it manually.");
    }
  }

  return (
    <>
      <button className="small-button" type="button" onClick={() => setOpen(true)}>
        <Search size={14} /> View evidence
      </button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="modal evidence-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="actions">
                  <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                  <span className={`badge ${finding.status}`}>{finding.status.replace("_", " ")}</span>
                  <span className="badge">{finding.category}</span>
                </div>
                <h2 id={titleId}>{finding.title}</h2>
                <p className="muted">{finding.description}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close evidence dialog">
                <X size={17} />
              </button>
            </div>
            <div className="evidence-grid">
              <section>
                <h3>Evidence</h3>
                <p>{finding.evidence}</p>
              </section>
              <section>
                <h3>Impact</h3>
                <p>{finding.impact}</p>
              </section>
              <section>
                <h3>Recommended fix</h3>
                <p>{finding.recommendation}</p>
              </section>
            </div>
            {finding.technicalDetails ? (
              <section className="evidence-details">
                <h3>Technical details</h3>
                <pre>{finding.technicalDetails}</pre>
              </section>
            ) : (
              <p className="muted">No element-level details were stored for this finding. Rerun the audit to capture the latest expanded evidence format.</p>
            )}
            {urls.length > 0 ? (
              <section className="evidence-details">
                <h3>Referenced URLs</h3>
                <div className="evidence-links">
                  {urls.map((url) => (
                    <a href={url} target="_blank" rel="noreferrer" key={url}>
                      {url}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
            {imageUrls.length > 0 ? (
              <section className="evidence-details">
                <h3>Image previews</h3>
                <div className="evidence-images">
                  {imageUrls.map((url) => (
                    <a href={url} target="_blank" rel="noreferrer" key={url} title={url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" loading="lazy" />
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
            <div className="actions evidence-actions">
              <button type="button" onClick={copyEvidence}>
                <Copy size={16} /> Copy evidence
              </button>
              {message ? <span className="inline-status">{message}</span> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
