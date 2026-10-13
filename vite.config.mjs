import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: "app.html",
      output: {
        assetFileNames: "assets/app[extname]",
        chunkFileNames: "assets/[name].js",
        entryFileNames: "assets/app.js",
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
