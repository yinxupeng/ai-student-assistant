import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "./",
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: "dist/assets",
    emptyOutDir: false,
    lib: { entry: "src/main.ts", name: "StudentArchive", formats: ["iife"], fileName: () => "app.js", cssFileName: "app" },
    rollupOptions: {
      output: {
        assetFileNames: "app[extname]",
      },
    },
  },
  optimizeDeps: {
    include: ["vue", "element-plus"],
  },
  server: {
    warmup: {
      clientFiles: ["./src/main.ts"],
    },
  },
  plugins: [vue()],
});
