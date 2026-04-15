import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@sparkjsdev/spark": resolve(__dirname, "vendor/spark/dist/spark.module.js"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    css: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.ts"],
  },
});
