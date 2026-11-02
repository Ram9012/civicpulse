import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: "../..", // read the single root .env
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
