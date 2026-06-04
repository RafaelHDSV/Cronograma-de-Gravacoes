import { useState } from 'react'
import { loginEditor } from '../lib/api'
import { setEditorToken } from '../lib/authStorage'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditorLoginModal({ open, onClose, onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await loginEditor(password)
      setEditorToken(token)
      setPassword('')
      onSuccess()
      onClose()
    } catch (err) {
      setError('Senha inválida ou servidor indisponível.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="modal-panel modal-panel-sm">
        <h2 id="login-title" className="modal-title">
          Modo editor
        </h2>
        <p className="modal-desc">
          Informe a senha da equipe uma vez. O acesso fica salvo neste navegador até você sair.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="editor-password">
            Senha
          </label>
          <input
            id="editor-password"
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="error modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
