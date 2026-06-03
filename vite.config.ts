import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativo ('./') funciona tanto em GitHub Pages (subpath do repo)
// quanto em Vercel/servidor na raiz, sem precisar ajustar o caminho.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3333,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3334',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3333,
  },
})
