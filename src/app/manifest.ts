import type { MetadataRoute } from "next";

// Manifiesto mínimo (B1). El service worker y la estrategia de actualización llegan en B7 (EPIC-024).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Control360 · Grupo Pecuario",
    short_name: "Control360",
    description: "Gestión operativa de Grupo Pecuario",
    lang: "es-BO",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef2ef",
    theme_color: "#157a5b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
