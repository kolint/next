import knockoutSSR from "../../src/vite/plugin.js";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [knockoutSSR()],
  server: {
    hmr: false,
  },
});
