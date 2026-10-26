import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// base relativo ('./') funciona tanto em GitHub Pages (subpath do repo)
// quanto em Vercel/servidor na raiz, sem precisar ajustar o caminho.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const release = env.VERCEL_GIT_COMMIT_SHA ?? ''
  const uploadSourceMaps = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT)

  return {
    base: './',
    plugins: [
      react(),
      ...(uploadSourceMaps
        ? [
            sentryVitePlugin({
              authToken: env.SENTRY_AUTH_TOKEN,
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              release: release ? { name: release } : undefined,
              sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
              telemetry: false,
            }),
          ]
        : []),
    ],
    define: {
      'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(release),
    },
    build: {
      sourcemap: uploadSourceMaps ? 'hidden' : false,
    },
    optimizeDeps: {
      exclude: ['@vieira/institucional', '@vieira/analytics'],
    },
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
  }
})
