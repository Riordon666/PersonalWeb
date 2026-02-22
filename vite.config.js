import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
      },
    },
    minify: 'terser',
    cssMinify: true,
  },
  server: {
    port: 8080,
    open: true,
    allowedHosts: ['riordon.xyz'],
  },
})
