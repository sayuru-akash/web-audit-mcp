import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fb",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #38bdf8, #2563eb 52%, #1d4ed8)",
            borderRadius: 999,
            boxShadow: "0 20px 48px rgba(37, 99, 235, 0.28)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "#f7f8fb",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
