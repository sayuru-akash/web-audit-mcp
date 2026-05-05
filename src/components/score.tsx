import { scoreLabel } from "@/lib/scoring";

export function ScoreRing({ score }: { score?: number }) {
  const value = score ?? 0;
  return (
    <div className="score-ring" style={{ "--score": value } as React.CSSProperties} aria-label={`Score ${value}`}>
      <span>{score ?? "-"}</span>
    </div>
  );
}

export function ScoreText({ score }: { score?: number }) {
  return (
    <span>
      <strong>{score ?? "-"}</strong> <span className="muted">{scoreLabel(score)}</span>
    </span>
  );
}
