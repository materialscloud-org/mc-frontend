import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

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
});
