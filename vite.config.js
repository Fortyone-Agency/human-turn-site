import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const languages = ['', 'de/', 'fr/', 'es/', 'ja/'];

export default defineConfig({
  build: {
    rollupOptions: {
      input: languages.flatMap((language) => [
        resolve(`${language}index.html`),
        resolve(`${language}privacy/index.html`),
      ]),
    },
  },
});