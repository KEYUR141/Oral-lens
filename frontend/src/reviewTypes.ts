export type Paper = { paper_id: string; title: string; year: number | null; source: string }
export type Assessment = {
  support: string; explanation: string
  evidence: { passage_id: number; quote: string }[]; limitations: string[]
  missing_information?: string | null; needs_more_evidence?: boolean
}
export type Passage = {
  passage_id: number; paper_id: string; title: string; text: string; source: string; truncated: boolean
}
export type Search = { query: string; paper_ids: string[]; returned_passage_ids: number[]; new_passage_ids: number[] }
export type Review = {
  claim: string; paper_ids: string[]; status: string; human_review: string; source_validation: string
  assessment: Assessment | null; assessment_history: Assessment[]; search_history: Search[]
  passages: Passage[]; errors: string[]; events: string[]; model: string | null
  usage: Record<string, number>; provenance_note: string; search_count: number
  stop_reason: string | null; warnings: string[]
}
export type Turn = {
  id: string; createdAt: string; claim: string; papers: Paper[]
  state: 'running' | 'returned' | 'interrupted' | 'transport_error'
  result: Review | null; error?: string
}
export type Thread = { id: string; title: string; createdAt: string; turns: Turn[] }
export const readable = (value: string) => value.replaceAll('_', ' ')
