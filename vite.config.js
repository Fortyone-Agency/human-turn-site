import { resolve } from "node:path";
import { defineConfig } from "vite";
import { sitePath } from "./content/site.mjs";

const languages = ["", "de/", "fr/", "es/", "ja/"];

export default defineConfig({
  base: sitePath("/"),
  build: {
    rollupOptions: {
      input: languages.flatMap((language) => [
        resolve(`${language}index.html`),
        resolve(`${language}privacy/index.html`),
      ]),
    },
  },
});
