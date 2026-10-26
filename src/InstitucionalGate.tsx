import { LegalPage, NotFoundPage, Seo, SiteFooter } from '@vieira/institucional'
import { useEffect, useState } from 'react'
import { App } from './App'
import { institucionalView } from './institucionalPath'

function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  return pathname
}

/** Reafirma noindex depois do Seo das páginas legais, sem trocar o título. */
function KeepNoIndex() {
  useEffect(() => {
    let el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!el) {
      el = document.createElement('meta')
      el.name = 'robots'
      document.head.appendChild(el)
    }
    el.content = 'noindex, nofollow'
  })
  return null
}

export function InstitucionalGate() {
  const view = institucionalView(usePathname())

  if (view === 'privacy' || view === 'terms') {
    return (
      <>
        <LegalPage kind={view === 'privacy' ? 'privacy' : 'terms'} />
        <KeepNoIndex />
      </>
    )
  }

  if (view === 'not-found') {
    return (
      <>
        <NotFoundPage />
        <KeepNoIndex />
      </>
    )
  }

  return (
    <>
      <Seo noindex />
      <App />
      <SiteFooter className="app-legal-footer" />
    </>
  )
}
