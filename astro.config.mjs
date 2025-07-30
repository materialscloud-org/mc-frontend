import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.ASTRO_SITE || undefined,
  base: process.env.ASTRO_BASE || "/",
  vite: { plugins: [tailwindcss()] },
});
