import { defineConfig } from 'vite'
import { resolve, relative } from 'path'
import { readdirSync, statSync, existsSync } from 'fs'

// Collect every generated blog page (blog/**/index.html) as a build input,
// so `vite build` emits the full blog, not just the blog index.
function collectBlogPages() {
  const inputs = {}
  const blogRoot = resolve(__dirname, 'blog')
  if (!existsSync(blogRoot)) return inputs

  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = resolve(dir, name)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (name === 'index.html') {
        const rel = relative(blogRoot, dir).replace(/[\\/]/g, '-')
        inputs[rel ? `blog-${rel}` : 'blog'] = full
      }
    }
  }
  walk(blogRoot)
  return inputs
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...collectBlogPages(),
      },
    },
    cssMinify: true,
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
  },
  server: {
    port: 8080,
    open: true,
    allowedHosts: ['riordon.xyz', 'ruka.cc.cd', 'ruka.riordon.xyz'],
  },
  optimizeDeps: {
    include: [],
    exclude: [],
    esbuildOptions: {
      target: 'es2015',
    },
  },
})
