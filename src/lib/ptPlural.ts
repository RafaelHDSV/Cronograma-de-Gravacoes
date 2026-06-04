export function formatSessoesAtualizadas(count: number): string {
  if (count === 1) return '1 sessão será atualizada no banco.'
  return `${count} sessões serão atualizadas no banco.`
}

export function formatAlteracoesPendentes(count: number): string {
  if (count === 1) return '1 alteração pendente'
  return `${count} alterações pendentes`
}
