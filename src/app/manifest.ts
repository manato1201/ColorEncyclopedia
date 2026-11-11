import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Color Encyclopedia",
    short_name: "Color",
    description: "色彩図鑑 — 色彩・図形理論を見て学ぶ",
    start_url: "/",
    display: "standalone",
    background_color: "#e5e4e0",
    theme_color: "#e5e4e0",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
