import type { Assessment, Review, Thread } from './reviewTypes'

export const HISTORY_KEY = 'oral-lens.review-threads.v1'
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(x => typeof x === 'string')
const numbers = (value: unknown) => Array.isArray(value) && value.every(Number.isInteger)
function assessment(value: unknown): value is Assessment {
  return object(value) && typeof value.support === 'string' && typeof value.explanation === 'string'
    && (value.missing_information == null || typeof value.missing_information === 'string')
    && (value.needs_more_evidence === undefined || typeof value.needs_more_evidence === 'boolean')
    && strings(value.limitations) && Array.isArray(value.evidence)
    && value.evidence.every(e => object(e) && Number.isInteger(e.passage_id) && typeof e.quote === 'string')
}
export function isReview(value: unknown): value is Review {
  return object(value) && typeof value.claim === 'string' && strings(value.paper_ids)
    && typeof value.status === 'string' && typeof value.source_validation === 'string'
    && typeof value.human_review === 'string' && typeof value.provenance_note === 'string'
    && (value.assessment === null || assessment(value.assessment))
    && Array.isArray(value.assessment_history) && value.assessment_history.every(assessment)
    && Array.isArray(value.search_history) && value.search_history.every(s => object(s)
      && typeof s.query === 'string' && strings(s.paper_ids) && numbers(s.returned_passage_ids) && numbers(s.new_passage_ids))
    && Array.isArray(value.passages) && value.passages.every(p => object(p) && Number.isInteger(p.passage_id)
      && typeof p.paper_id === 'string' && typeof p.title === 'string' && typeof p.text === 'string'
      && typeof p.source === 'string' && typeof p.truncated === 'boolean')
    && strings(value.events) && strings(value.errors) && strings(value.warnings) && object(value.usage)
    && Object.values(value.usage).every(n => typeof n === 'number' && Number.isFinite(n))
    && (value.model === null || typeof value.model === 'string')
    && Number.isInteger(value.search_count) && Number(value.search_count) >= 0 && Number(value.search_count) <= 2
    && (value.stop_reason === null || typeof value.stop_reason === 'string')
}
export function decodeHistory(raw: string | null): Thread[] {
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!object(parsed) || parsed.version !== 1 || !Array.isArray(parsed.threads)) throw new Error('Invalid history')
  const ids = new Set<string>()
  for (const thread of parsed.threads) {
    if (!object(thread) || typeof thread.id !== 'string' || typeof thread.title !== 'string'
      || typeof thread.createdAt !== 'string' || !Array.isArray(thread.turns) || ids.has(thread.id)) throw new Error('Invalid thread')
    ids.add(thread.id)
    const turnIds = new Set<string>()
    for (const turn of thread.turns) {
      if (!object(turn) || typeof turn.id !== 'string' || turnIds.has(turn.id)
        || typeof turn.claim !== 'string' || typeof turn.createdAt !== 'string'
        || !['running', 'returned', 'interrupted', 'transport_error'].includes(String(turn.state))
        || (turn.error !== undefined && typeof turn.error !== 'string')
        || !Array.isArray(turn.papers) || !turn.papers.every(p => object(p) && typeof p.paper_id === 'string'
          && typeof p.title === 'string' && (p.year === null || typeof p.year === 'number') && typeof p.source === 'string')
        || (turn.result !== null && !isReview(turn.result))
        || (turn.state === 'returned' && turn.result === null)) throw new Error('Invalid turn')
      turnIds.add(turn.id)
      // Browser reload cannot establish what happened to an in-flight server run.
      if (turn.state === 'running') {
        turn.state = 'interrupted'
        turn.error = 'Browser session interrupted. Server outcome is unknown; check before submitting again.'
      }
    }
  }
  return parsed.threads as Thread[]
}
export function encodeHistory(threads: Thread[]): string {
  return JSON.stringify({ version: 1, threads })
}
