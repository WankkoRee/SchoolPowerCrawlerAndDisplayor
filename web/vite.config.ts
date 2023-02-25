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
  build: {
    target: [
      "es2015", // es6
      "edge88", // 发布于 2021年1月21日，首个 Edge Chromium 版本
      "firefox59", // 发布于 2018年3月13日
      "chrome65", // 发布于 2018年3月6日
      "safari12", // 发布于 2018年9月24日
    ],
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
