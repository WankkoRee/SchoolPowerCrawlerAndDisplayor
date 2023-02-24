import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    createHtmlPlugin({
      minify: true,
      entry: "src/main.ts",
      inject: {
        data: {},
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://power.daixia.hu",
        changeOrigin: true,
      },
    },
  },
});
