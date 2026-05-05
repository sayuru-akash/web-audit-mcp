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
          background: "#101418",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 116,
            height: 116,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #2dd4bf, #0f766e)",
            borderRadius: 28,
            color: "white",
            fontSize: 72,
            fontWeight: 900,
          }}
        >
          W
        </div>
      </div>
    ),
    size,
  );
}
