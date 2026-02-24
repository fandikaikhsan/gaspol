import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = "image/png"

// Image generation
export default function Icon() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 24,
        background: "#E4D4F4",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        border: "2px solid #2D2D2D",
        boxShadow: "2px 2px 0px #2D2D2D",
        color: "#2D2D2D",
        fontWeight: "bold",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2D2D2D"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 3.82-13s-1.41 2.54-1.41 4.67c0 1.1.9 2 2 2s2-.9 2-2c0-2.13-1.41-4.67-1.41-4.67a22 22 0 0 1 13 3.82c-1.26 1.5-5 2-5 2s.5-3.74 2-5c-.84-.71-2.13-.7-2.91.09a2.18 2.18 0 0 0-.09 2.91z" />
        <path d="m9 11.5 3 3" />
      </svg>
    </div>,
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    },
  )
}
