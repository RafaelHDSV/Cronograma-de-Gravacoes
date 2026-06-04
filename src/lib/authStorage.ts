const TOKEN_KEY = 'cronograma_editor_token'

export function getEditorToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setEditorToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearEditorToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
