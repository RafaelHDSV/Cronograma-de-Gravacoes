import type { Person, Topic } from './types'

/** Letras na ordem efetiva de gravacao. */
export function getTopicOrder(person: Person): string[] {
  if (person.topicOrder?.length) return person.topicOrder
  return person.topics.map((t) => t.letter)
}

/** Topic objects na ordem de gravacao. */
export function getOrderedTopics(person: Person): Topic[] {
  const order = getTopicOrder(person)
  const byLetter = new Map(person.topics.map((t) => [t.letter, t]))
  return order.map((letter) => byLetter.get(letter)).filter((t): t is Topic => t !== undefined)
}
