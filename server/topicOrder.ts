import type { Topic } from './data.js'

/** Resolve ordem efetiva: dedupe, ignora invalidas, acrescenta faltantes ao final. */
export function resolveTopicOrder(
  topics: Topic[],
  topicOrder: string[] | undefined,
  logPrefix?: string,
): string[] {
  const defaultOrder = topics.map((t) => t.letter)
  if (!topicOrder?.length) return defaultOrder

  const validLetters = new Set(defaultOrder)
  const seen = new Set<string>()
  const result: string[] = []

  for (const letter of topicOrder) {
    if (!validLetters.has(letter)) {
      if (logPrefix) console.warn(`${logPrefix} letra invalida ignorada: ${letter}`)
      continue
    }
    if (seen.has(letter)) {
      if (logPrefix) console.warn(`${logPrefix} letra duplicada ignorada: ${letter}`)
      continue
    }
    seen.add(letter)
    result.push(letter)
  }

  const missing = defaultOrder.filter((l) => !seen.has(l)).sort()
  return [...result, ...missing]
}
