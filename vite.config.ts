import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": resolve(__dirname, "./src/core"),
      "@services": resolve(__dirname, "./src/services"),
      "@features": resolve(__dirname, "./src/features"),
      "@shared": resolve(__dirname, "./src/shared"),
    },
  },
  server: {
    port: 5173,
  },
});
