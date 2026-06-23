export function formatSessoesAtualizadas(count: number): string {
  if (count === 1) return '1 sessão será atualizada no banco.'
  return `${count} sessões serão atualizadas no banco.`
}

export function formatAlteracoesPendentes(count: number): string {
  if (count === 1) return '1 alteração pendente'
  return `${count} alterações pendentes`
}

export function formatTopicos(count: number): string {
  if (count === 1) return '1 tópico'
  return `${count} tópicos`
}

export function formatSessoes(count: number): string {
  if (count === 1) return '1 sessão'
  return `${count} sessões`
}

export function formatTopicSessionSummary(total: number, done: number): string {
  if (total === 0) return 'Sem sessão agendada'
  if (total === 1) {
    return done === 1 ? '1 sessão concluída' : '1 sessão'
  }
  return `${formatSessoes(total)}, ${done} concluída${done === 1 ? '' : 's'}`
}
