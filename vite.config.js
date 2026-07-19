import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'templates/index.html',
        mevzuat: 'templates/mevzuat.html',
      },
    },
  },
});
