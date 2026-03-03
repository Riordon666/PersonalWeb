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
      output: {
        manualChunks: {
          'blog-vendor': ['vite'],
        },
      },
    },
    minify: 'terser',
    cssMinify: true,
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
  },
  server: {
    port: 8080,
    open: true,
    allowedHosts: ['riordon.xyz','ruka.cc.cd','ruka.riordon.xyz'],
  },
  optimizeDeps: {
    include: [],
    exclude: [],
  esbuildOptions: {
      target: 'es2015',
    },
  },
})
