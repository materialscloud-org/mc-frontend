import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";

export default defineConfig({
  site: process.env.ASTRO_SITE || undefined,
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

  site: "https://www.materialscloud.org",
  integrations: [react(), sitemap()],
});
