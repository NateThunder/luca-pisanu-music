import { ImageResponse } from "next/og";

export const alt = "Luca Pisanu — Independent Artist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#151515",
          color: "#e8e2d4",
          display: "flex",
          height: "100%",
          width: "100%",
          padding: 62,
          position: "relative",
          fontFamily: "Arial Narrow, Arial, sans-serif",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(232,226,212,.25)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 42,
            width: "100%",
          }}
        >
          <div aria-hidden="true" />
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 116, fontWeight: 800, lineHeight: 0.8 }}>
                LUCA
              </div>
              <div style={{ fontSize: 116, fontWeight: 800, lineHeight: 0.8 }}>
                PISANU
              </div>
            </div>
            <div
              style={{
                background: "#cf9418",
                borderRadius: "50%",
                height: 220,
                marginLeft: "auto",
                width: 220,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Singer & Songwriter · Composer & Producer · Multi-Instrumentalist
          </div>
        </div>
      </div>
    ),
    size,
  );
}
