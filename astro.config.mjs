import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";

export default defineConfig({
  site: process.env.ASTRO_SITE || "https://www.materialscloud.org",
  base: process.env.ASTRO_BASE || "/",
  vite: {
    resolve: {
      alias: {
        "@layouts": "/src/layouts",
        "@components": "/src/components",
        "@data": "/src/data",
      },
    },
    plugins: [tailwindcss()],
  },
  integrations: [react(), sitemap()],

  // ----
  // Canonicalize URLs without trailing slash
  trailingSlash: "never",
  build: {
    // needed for Cloudflare - otherwise "directory" redirects to trailing slash
    format: "file",
  },
  // ----
});
