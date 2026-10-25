export type InstitucionalView = 'app' | 'privacy' | 'terms' | 'not-found'

/**
 * As abas não mudam a URL. O painel é `/` (e `index.html`).
 * `/privacidade` e `/termos` são as páginas legais; qualquer outro caminho é 404.
 * O modo editor é um modal em `/`, não uma rota.
 */
export function institucionalView(pathname: string): InstitucionalView {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/' || path.endsWith('/index.html')) return 'app'

  const last = path.split('/').filter(Boolean).pop() ?? ''
  if (last === 'privacidade') return 'privacy'
  if (last === 'termos') return 'terms'
  return 'not-found'
}
