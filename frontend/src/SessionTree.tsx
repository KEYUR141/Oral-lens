import type { Assessment, Search, Turn } from './reviewTypes'
import { readable } from './reviewTypes'

export type TraceNode = {
  id: string; label: string; detail: string; kind: 'scope' | 'search' | 'assessment' | 'validation' | 'outcome'
  search?: Search; assessment?: Assessment; checkNumber?: number
}
export function traceNodes(turn: Turn): TraceNode[] {
  const result = turn.result
  if (!result) return [{ id: 'waiting', label: turn.state === 'running' ? 'Waiting for backend' : 'Outcome unconfirmed',
    kind: 'outcome', detail: turn.error ?? 'Actual steps will appear after the request returns. No live step progress is available.' }]
  let searches = 0; let assessments = 0; let checks = 0
  const nodes: TraceNode[] = []
  for (const event of result.events) {
    if (event === 'scope_checked') nodes.push({ id: 'scope', kind: 'scope', label: 'Scope check',
      detail: result.status === 'out_of_scope' ? 'Request outside research scope.' : 'Scope response received. Consult errors if validation failed.' })
    if (event === 'passages_retrieved' || event === 'follow_up_search_completed') {
      const search = result.search_history[searches++]
      if (search) nodes.push({ id: `search-${searches}`, kind: 'search', search,
        label: searches === 1 ? 'Initial search' : 'Follow-up search',
        detail: `${search.returned_passage_ids.length} returned / ${search.new_passage_ids.length} new passages` })
    }
    if (event === 'assessment_generated') {
      const entry = result.assessment_history[assessments++]
      nodes.push({ id: `assessment-${assessments}`, kind: 'assessment', assessment: entry,
        label: assessments === 1 ? 'Draft assessment' : 'Reassessment',
        detail: entry ? readable(entry.support) : 'Response received; valid assessment unavailable.' })
    }
    if (event === 'sources_checked') nodes.push({ id: `check-${++checks}`, kind: 'validation',
      label: 'Source checks', detail: 'Mechanical citation checks executed.', checkNumber: checks })
  }
  nodes.push({ id: 'outcome', kind: 'outcome', label: readable(result.status),
    detail: readable(result.stop_reason ?? result.errors[0] ?? 'Run returned') })
  return nodes
}

export function SessionTree({ turn, selected, onSelect }: {
  turn: Turn; selected: string; onSelect: (id: string) => void
}) {
  const nodes = traceNodes(turn)
  return <nav className="session-tree" aria-label="Selected review execution tree">
    <div className="tree-root"><span className="tree-dot" /><span>Claim review</span></div>
    <ol>{nodes.map(node => <li key={node.id}>
      <button title={node.detail} onClick={() => onSelect(node.id)} className={selected === node.id ? 'selected' : ''} aria-pressed={selected === node.id}>
        <span className={`tree-dot ${node.kind === 'outcome' && turn.result?.status === 'failed' ? 'failed' : ''}`} />
        <span>{node.label}</span>
      </button>
      {node.search && node.search.returned_passage_ids.length > 0 && <ul className="tree-leaves">{node.search.returned_passage_ids.map((id, index) => <li key={`${id}-${index}`}>
        <button onClick={() => onSelect(`passage-${id}`)}>Passage #{id}<span className="muted">{node.search!.new_passage_ids.includes(id) ? 'new' : 'seen'}</span></button>
      </li>)}</ul>}
    </li>)}</ol>
  </nav>
}
