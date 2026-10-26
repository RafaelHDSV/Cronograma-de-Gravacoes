import { VieiraAnalytics } from '@vieira/analytics/react'
import { InstitucionalProvider } from '@vieira/institucional'
import { AppErrorBoundary, initSentry } from '@vieira/institucional/sentry'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { InstitucionalGate } from './InstitucionalGate'
import { institucionalConfig } from './institucional.config'
import './index.css'
import '@vieira/institucional/styles.css'

initSentry({
  enabled: import.meta.env.PROD,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  allowUrls: [window.location.origin],
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InstitucionalProvider config={institucionalConfig}>
      <AppErrorBoundary>
        <InstitucionalGate />
        <VieiraAnalytics projectKey="gravacoes-treinamento" />
      </AppErrorBoundary>
    </InstitucionalProvider>
  </StrictMode>,
)
