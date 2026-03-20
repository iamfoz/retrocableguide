import { createRoot } from "react-dom/client";
import RetroCableGuide from "./pages/guide-page.jsx";
import MosaicPage from "./pages/mosaic-page.jsx";

const path = window.location.pathname.replace(/\/+$/, "") || "/";

function HomePage() {
  const linkStyle = {
    color: "#ffffff",
    textDecoration: "none",
    fontFamily: "Futura, 'Futura PT', 'Century Gothic', Arial, sans-serif",
    fontWeight: 700,
    fontSize: "28px",
    border: "2px solid #ffffff",
    padding: "14px 24px",
    minWidth: "180px",
    textAlign: "center",
  };

  return (
    <div
      style={{
        width: "720px",
        height: "576px",
        background: "#000000",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
      }}
    >
      <div
        style={{
          fontFamily: "Futura, 'Futura PT', 'Century Gothic', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "36px",
          letterSpacing: "1px",
        }}
      >
        retrocableguide
      </div>
      <div style={{ display: "flex", gap: "24px" }}>
        <a href="/guide" style={linkStyle}>Guide</a>
        <a href="/mosaic" style={linkStyle}>Mosaic</a>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  path === "/mosaic"
    ? <MosaicPage />
    : path === "/guide"
      ? <RetroCableGuide />
      : <HomePage />,
);
