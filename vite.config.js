import { defineConfig } from 'vite';

// Three pages: the portfolio plus the privacy policy and terms.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        privacy: 'privacy.html',
        terms: 'terms.html',
      },
    },
  },
});
