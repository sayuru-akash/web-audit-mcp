import { ImageResponse } from "next/og";

export const alt = "Web Audit report dashboard preview";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#101418",
          color: "#f8fafc",
          fontFamily: "Arial",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 34, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 800 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                background: "#0f766e",
              }}
            >
              W
            </div>
            Web Audit
          </div>
          <div style={{ fontSize: 74, lineHeight: 0.98, fontWeight: 900, letterSpacing: 0, maxWidth: 840 }}>
            Know what is broken. Fix what matters.
          </div>
          <div style={{ color: "#a8b3c2", fontSize: 27, maxWidth: 840, lineHeight: 1.35 }}>
            Performance, SEO, accessibility, security basics, mobile readiness, and technical health in one clean report.
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {["SEO", "Accessibility", "Security", "Performance"].map((item) => (
              <div
                key={item}
                style={{
                  padding: "12px 20px",
                  borderRadius: 999,
                  background: "#17242b",
                  border: "1px solid #2d3744",
                  color: "#d4dbe6",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
