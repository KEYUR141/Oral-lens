import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from './Icon'
import { decodeHistory, encodeHistory, HISTORY_KEY, isReview } from './sessionHistory'
import { SessionTree, traceNodes } from './SessionTree'
import type { Assessment, Paper, Thread, Turn } from './reviewTypes'
import { readable } from './reviewTypes'
import './Workbench.css'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, options)
  if (!response.ok) throw new Error(`Backend request failed (${response.status}). Check the API before retrying.`)
  return response.json() as Promise<T>
}
const freshThread = (): Thread => ({ id: crypto.randomUUID(), title: 'New review thread', createdAt: new Date().toISOString(), turns: [] })
type PaperDetail = Paper & { abstract: string | null; rows_by_source: { source: string; rows: number }[] }
type StoredPassage = { id: number; paper_id: string; source: string; chunk_index: number | null; text: string | null }
type SemanticMatch = Paper & { id: number; similarity?: number; match_method: 'text' | 'embedding' }
function loadHistory() {
  try { return { threads: decodeHistory(localStorage.getItem(HISTORY_KEY)), blocked: false } }
  catch { return { threads: [], blocked: true } }
}

function AssessmentDetail({ assessment, onSelect }: { assessment: Assessment; onSelect: (id: string) => void }) {
  return <><p className="eyebrow">MODEL DRAFT / {readable(assessment.support)}</p><p>{assessment.explanation}</p>
    {assessment.missing_information && <div className="gap-note"><strong>Evidence gap</strong><p>{assessment.missing_information}</p></div>}
    {assessment.evidence.map((reference, index) => <button className="evidence-reference" key={index} onClick={() => onSelect(`passage-${reference.passage_id}`)}><span>Passage #{reference.passage_id} <Icon name="external" /></span><q>{reference.quote}</q></button>)}
    <details><summary>Limitations ({assessment.limitations.length})</summary><ul>{assessment.limitations.map((text, index) => <li key={index}>{text}</li>)}</ul></details></>
}

function Inspector({ turn, selected, onSelect }: { turn: Turn; selected: string; onSelect: (id: string) => void }) {
  const result = turn.result
  const node = traceNodes(turn).find(n => n.id === selected)
  const passage = selected.startsWith('passage-') ? result?.passages.find(p => `passage-${p.passage_id}` === selected) : undefined
  return <section className="node-inspector" aria-label="Selected node details">
    <p className="eyebrow">INSPECT / {passage ? `PASSAGE ${passage.passage_id}` : node?.label ?? 'RUN OUTCOME'}</p>
    {result && <p className="small muted">Source checks: {readable(result.source_validation)} / Human: {readable(result.human_review)}</p>}
    {!!result?.errors.length && <div className="notice error"><strong>Run incomplete</strong><ul>{result.errors.map((error, index) => <li key={index}>{readable(error)}</li>)}</ul></div>}
    {passage ? <><h3>{passage.title}</h3><p className="small muted">{readable(passage.source)} / {passage.paper_id}{passage.truncated ? ' / Truncated excerpt' : ''}</p><p className="source-text">{passage.text}</p></>
      : selected.startsWith('passage-') ? <p className="notice error">This reference has no returned passage. Inspect the run's source-check errors.</p>
      : node?.search ? <><h3>{node.label}</h3><p>{node.search.query}</p><p className="small muted">{node.detail}</p>{!!node.search.uncovered_paper_ids?.length && <details><summary>{node.search.uncovered_paper_ids.length} selected papers without returned passages</summary><ul>{node.search.uncovered_paper_ids.map(id => <li key={id}>{turn.papers.find(p => p.paper_id === id)?.title ?? id}</li>)}</ul><p>Not returned does not mean no evidence exists.</p></details>}<details><summary>Original search scope</summary><ul>{turn.papers.map(p => <li key={p.paper_id}>{p.title}</li>)}</ul></details></>
      : node?.assessment ? <AssessmentDetail assessment={node.assessment} onSelect={onSelect} />
      : node?.kind === 'validation' ? <><h3>Mechanical source checks</h3><p>Final status: {readable(result?.source_validation ?? 'not_checked')}</p></>
      : node?.kind === 'scope' ? <><h3>Research scope</h3><p>{node.detail}</p></>
      : <><h3>{result ? readable(result.status) : 'Waiting for a result'}</h3><p>{turn.error ?? node?.detail}</p>

        {(result?.warnings ?? []).map((warning, index) => <p className="gap-note" key={index}>{warning}</p>)}</>}
    {result && <details className="technical-details"><summary>Run data & CLI request</summary><p className="small">{result.model ?? 'Model unavailable'} / {result.usage.total_tokens ?? 'Unknown'} tokens</p><pre>{JSON.stringify({ claim: turn.claim, paper_ids: turn.papers.map(p => p.paper_id) }, null, 2)}</pre><a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">API docs <Icon name="external" /></a><pre>{JSON.stringify(result, null, 2)}</pre><p className="small muted">Backend provenance (this browser keeps a separate local copy): {result.provenance_note}</p></details>}
  </section>
}

export default function Workbench() {
  const [initial] = useState(loadHistory)
  const [threads, setThreads] = useState<Thread[]>(() => initial.threads.length ? initial.threads : [freshThread()])
  const [threadId, setThreadId] = useState(() => threads[0].id)
  const [turnId, setTurnId] = useState<string | null>(() => threads[0].turns.at(-1)?.id ?? null)
  const [selectedNode, setSelectedNode] = useState('outcome')
  const [papers, setPapers] = useState<Paper[]>([])
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>(() => threads[0].turns.at(-1)?.papers ?? [])
  const [scopeOpen, setScopeOpen] = useState(!threads[0].turns.length)
  const [searchMode, setSearchMode] = useState<'title' | 'topic'>('title')
  const [semanticMatches, setSemanticMatches] = useState<SemanticMatch[]>([])
  const [searchNote, setSearchNote] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PaperDetail | null>(null)
  const [previewPassages, setPreviewPassages] = useState<StoredPassage[]>([])
  const [matchedPassage, setMatchedPassage] = useState<StoredPassage | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [loadedQuery, setLoadedQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [paperError, setPaperError] = useState('')
  const [claim, setClaim] = useState('')
  const [busy, setBusy] = useState(false)
  const [storageWarning, setStorageWarning] = useState(initial.blocked ? 'Local history could not be read. Existing storage was preserved; new work is memory-only until you clear local history.' : '')
  const storageBlocked = useRef(initial.blocked)
  const inFlight = useRef(false)
  const searchSequence = useRef(0)
  const previewSequence = useRef(0)
  const activeThread = threads.find(t => t.id === threadId) ?? threads[0]
  const activeTurn = activeThread.turns.find(t => t.id === turnId) ?? activeThread.turns.at(-1)

  useEffect(() => {
    if (storageBlocked.current) return
    try { localStorage.setItem(HISTORY_KEY, encodeHistory(threads)); setStorageWarning('') }
    catch { setStorageWarning('Browser storage is unavailable or full. Changes remain in memory and may be lost on refresh.') }
  }, [threads])

  async function loadPapers(term = '', page = 0) {
    const sequence = ++searchSequence.current
    setLoading(true); setPaperError('')
    try {
      const response = await api<{ items: Paper[] }>(`/papers?limit=10&offset=${page}&search=${encodeURIComponent(term)}`)
      if (sequence === searchSequence.current) { setPapers(response.items); setOffset(page); setLoadedQuery(term) }
    } catch (error) { if (sequence === searchSequence.current) setPaperError((error as Error).message) }
    finally { if (sequence === searchSequence.current) setLoading(false) }
  }
  async function searchTopic() {
    const sequence = ++searchSequence.current
    setLoading(true); setPaperError('')
    try {
      const response = await api<{ items: SemanticMatch[]; note: string }>('/papers/search/semantic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 12 }),
      })
      if (sequence === searchSequence.current) { setSemanticMatches(response.items); setSearchNote(response.note) }
    } catch (error) { if (sequence === searchSequence.current) setPaperError((error as Error).message) }
    finally { if (sequence === searchSequence.current) setLoading(false) }
  }
  async function showPreview(paperId: string, matchId?: number) {
    const sequence = ++previewSequence.current
    if (previewId === paperId) { setPreviewId(null); setPreview(null); setPreviewPassages([]); setMatchedPassage(null); return }
    setPreviewId(paperId); setPreview(null); setPreviewPassages([]); setMatchedPassage(null); setPreviewError(''); setPreviewLoading(true)
    try {
      const [detail, passages, matched] = await Promise.all([
        api<PaperDetail>(`/papers/${encodeURIComponent(paperId)}`),
        api<{ items: StoredPassage[] }>(`/papers/${encodeURIComponent(paperId)}/passages?limit=3`),
        matchId ? api<StoredPassage>(`/passages/${matchId}`) : Promise.resolve(null),
      ])
      if (sequence === previewSequence.current) { setPreview(detail); setPreviewPassages(passages.items); setMatchedPassage(matched && matched.id === matchId && matched.paper_id === paperId ? matched : null) }
    } catch (error) { if (sequence === previewSequence.current) setPreviewError((error as Error).message) }
    finally { if (sequence === previewSequence.current) setPreviewLoading(false) }
  }
  useEffect(() => { void loadPapers(); return () => { searchSequence.current++ } }, [])

  function selectThread(thread: Thread) {
    setThreadId(thread.id); setTurnId(thread.turns.at(-1)?.id ?? null); setSelectedNode('outcome')
    setSelectedPapers(thread.turns.at(-1)?.papers ?? []); setClaim(''); setScopeOpen(!thread.turns.length)
  }
  function newThread() {
    const thread = freshThread()
    setThreads(previous => [thread, ...previous]); selectThread(thread)
  }
  function clearHistory() {
    if (inFlight.current) return
    try { localStorage.removeItem(HISTORY_KEY); storageBlocked.current = false; setStorageWarning('') }
    catch { storageBlocked.current = true; setStorageWarning('Could not clear browser storage. Session data remains memory-only.') }
    const thread = freshThread(); setThreads([thread]); selectThread(thread)
  }
  function updateTurn(sessionId: string, id: string, update: Partial<Turn>) {
    setThreads(previous => previous.map(thread => thread.id !== sessionId ? thread : {
      ...thread, turns: thread.turns.map(turn => turn.id === id ? { ...turn, ...update } : turn),
    }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (inFlight.current || !selectedPapers.length || claim.trim().length < 5) return
    const sessionId = activeThread.id
    const turn: Turn = { id: crypto.randomUUID(), claim: claim.trim(), papers: [...selectedPapers],
      createdAt: new Date().toISOString(), state: 'running', result: null }
    inFlight.current = true; setBusy(true)
    setThreads(previous => previous.map(thread => thread.id !== sessionId ? thread : {
      ...thread, title: thread.turns.length ? thread.title : turn.claim.slice(0, 55), turns: [...thread.turns, turn],
    }))
    setTurnId(turn.id); setSelectedNode('waiting'); setClaim(''); setScopeOpen(false)
    try {
      const result: unknown = await api('/reviews/assess', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: turn.claim, paper_ids: turn.papers.map(p => p.paper_id) }) })
      if (!isReview(result)) throw new Error('Unexpected review response. Server outcome is unconfirmed.')
      updateTurn(sessionId, turn.id, { state: 'returned', result })
    } catch (error) {
      updateTurn(sessionId, turn.id, { state: 'transport_error', error: `${(error as Error).message} No automatic retry was made.` })
    } finally { inFlight.current = false; setBusy(false) }
  }

  const currentNode = selectedNode === 'waiting' && activeTurn?.result ? 'outcome' : selectedNode
  return <main id="workspace-main" className="workbench">
    <aside className="thread-sidebar"><div className="thread-heading"><p className="eyebrow">REVIEW THREADS</p><button className="secondary" onClick={newThread}>+ New thread</button></div>
      <nav className="thread-list" aria-label="Review thread history">{threads.map(thread => <button key={thread.id} className={thread.id === activeThread.id ? 'active' : ''} onClick={() => selectThread(thread)} aria-current={thread.id === activeThread.id ? 'page' : undefined}><span>{thread.title}</span>{thread.turns.some(t => t.state === 'running') && <span className="small">Running...</span>}</button>)}</nav>
      <div className="local-history"><button className="text-button" disabled={busy} onClick={clearHistory}>Clear local history</button></div>
    </aside>
    <section className="thread-workspace"><header className="conversation-heading"><div><h1>{activeThread.turns.length ? 'Review thread' : 'Start with a research claim.'}</h1></div><span className="tag">Local history</span></header>
      {storageWarning && <p className="notice error" role="status">{storageWarning}</p>}

      <div className="library-toggle"><button type="button" className="text-button" aria-expanded={scopeOpen} onClick={() => setScopeOpen(!scopeOpen)}><Icon name="document" /> Research paper library {selectedPapers.length ? `· ${selectedPapers.length} selected` : ''}</button><span className="small muted">Existing corpus · reviewer selects scope</span></div>
      {scopeOpen && <section className="scope-picker document-library" aria-label="Research paper library">
        <div className="library-tabs" role="group" aria-label="Document search mode"><button type="button" className={searchMode === 'title' ? 'active' : ''} onClick={() => { searchSequence.current++; previewSequence.current++; setPreviewId(null); setLoading(false); setPaperError(''); setSearchMode('title'); setQuery('') }}>Browse titles</button><button type="button" className={searchMode === 'topic' ? 'active' : ''} onClick={() => { searchSequence.current++; previewSequence.current++; setPreviewId(null); setSemanticMatches([]); setSearchNote(''); setLoading(false); setPaperError(''); setSearchMode('topic'); setQuery('') }}>Search document content</button></div>
        <label htmlFor="scope-query">{searchMode === 'title' ? 'Search paper titles' : 'Describe the research topic'}</label>
        <div className="search"><input id="scope-query" value={query} maxLength={300} placeholder={searchMode === 'title' ? 'e.g. SLC38A1' : 'e.g. mouse tongue epithelium proliferation'} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (searchMode === 'title') void loadPapers(query); else if (query.trim().length >= 3) void searchTopic() } }} /><button type="button" className="icon-button" disabled={loading || (searchMode === 'topic' && query.trim().length < 3)} onClick={() => { if (searchMode === 'title') void loadPapers(query); else void searchTopic() }} aria-label={searchMode === 'title' ? 'Search paper titles' : 'Search document content'}><Icon name="search" /></button></div>
        {searchMode === 'topic' && <p className="library-note">{searchNote || 'Stored text matches appear first, then inherited embedding suggestions. Inspect excerpts before selecting papers.'}</p>}
        {selectedPapers.length > 0 && <div className="selected-list">{selectedPapers.map(p => <button type="button" key={p.paper_id} onClick={() => setSelectedPapers(previous => previous.filter(item => item.paper_id !== p.paper_id))}>{p.title.slice(0, 35)}… <Icon name="close" /></button>)}</div>}
        {paperError ? <p className="notice error" role="status">{paperError}</p> : loading ? <p className="small muted">Searching papers...</p> : <div className="paper-list">{(searchMode === 'title' ? papers : semanticMatches).map(p => <div className="library-paper" key={p.paper_id}><label className="paper"><input type="checkbox" checked={selectedPapers.some(item => item.paper_id === p.paper_id)} disabled={selectedPapers.length >= 10 && !selectedPapers.some(item => item.paper_id === p.paper_id)} onChange={e => setSelectedPapers(previous => e.target.checked ? [...previous, { paper_id: p.paper_id, title: p.title, year: p.year ?? null, source: p.source }] : previous.filter(item => item.paper_id !== p.paper_id))} /><span><span className="paper-title">{p.title}</span><span className="paper-meta">{p.year ?? 'Year unknown'}{searchMode === 'topic' && 'match_method' in p ? ` · ${p.match_method === 'text' ? 'Text match' : 'Embedding suggestion'} · ${p.source}` : ''}</span></span></label><button type="button" className="text-button preview-button" onClick={() => void showPreview(p.paper_id, searchMode === 'topic' ? (p as SemanticMatch).id : undefined)} aria-expanded={previewId === p.paper_id}>{previewId === p.paper_id ? 'Close' : 'Preview'}</button></div>)}{!(searchMode === 'title' ? papers : semanticMatches).length && <p className="small muted">{searchMode === 'title' ? 'No matching papers.' : 'Describe a topic and search the stored documents.'}</p>}</div>}
        {searchMode === 'title' && <div className="pagination"><button type="button" className="text-button" disabled={loading || offset === 0} onClick={() => void loadPapers(loadedQuery, offset - 10)}>Previous</button><span className="small muted">{selectedPapers.length}/10 selected</span><button type="button" className="text-button" disabled={loading || papers.length < 10} onClick={() => void loadPapers(loadedQuery, offset + 10)}>Next</button></div>}
        {searchMode === 'topic' && <p className="small muted">{selectedPapers.length}/10 selected · Ranking is from stored rows; review the source text before making a claim.</p>}
        {previewId && <section className="paper-preview" aria-label="Stored document preview">{previewLoading ? <p>Loading stored text...</p> : previewError ? <p className="notice error">{previewError}</p> : preview && <><h3>{preview.title}</h3><p className="small muted">{preview.year ?? 'Year unknown'} · {preview.rows_by_source.map(row => `${row.rows} ${row.source}`).join(' · ')}</p>{matchedPassage && <><h4>Matched stored row</h4><div className="preview-passage"><p className="small muted">Row #{matchedPassage.id} · {matchedPassage.source} · chunk {matchedPassage.chunk_index ?? 'unknown'}</p><p>{matchedPassage.text || 'No text stored in this row.'}</p></div></>}<h4>Stored abstract</h4><p className="preview-text">{preview.abstract || 'No abstract stored for this paper.'}</p><h4>Other stored passages</h4>{previewPassages.filter(passage => passage.id !== matchedPassage?.id).map(passage => <div className="preview-passage" key={passage.id}><p className="small muted">Row #{passage.id} · {passage.source} · chunk {passage.chunk_index ?? 'unknown'}</p><p>{passage.text || 'No text stored in this row.'}</p></div>)}<p className="small muted">Preview shows stored excerpts, not a complete verified paper or page-level source.</p></>}</section>}
      </section>}
      <div className="conversation" aria-label="Claim and review messages" aria-live="polite">
        {!activeThread.turns.length && <div className="thread-welcome"><Icon name="lens" /><h2>One claim. A visible evidence trail.</h2></div>}
        {activeThread.turns.map((turn, index) => <article className={`conversation-turn ${activeTurn?.id === turn.id ? 'active' : ''}`} key={turn.id}>
          <div className="message user-message"><div className="message-meta">YOU / REVIEW {index + 1}<span>{new Date(turn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p>{turn.claim}</p><details><summary>{turn.papers.length} selected papers</summary><ul>{turn.papers.map(p => <li key={p.paper_id}>{p.title}</li>)}</ul></details></div>
          <div className="message assistant-message"><div className="message-meta">ORAL-LENS / DRAFT REVIEW</div>
            {turn.state === 'running' ? <p className="muted"><span className="spinner" /> Review running...</p>
              : turn.result ? <><span className={`tag ${turn.result.status === 'failed' ? 'bad' : 'blue'}`}>{readable(turn.result.status)}</span><p>{turn.result.assessment?.explanation ?? turn.result.errors[0] ?? 'No assessment returned.'}</p>
                <div className="message-footer"><span className="small muted">{turn.result.search_count}/2 searches / Human: {readable(turn.result.human_review)}</span><button className="text-button" onClick={() => { setTurnId(turn.id); setSelectedNode('outcome') }}>Inspect run <Icon name="right" /></button></div></>
              : <p className="notice error">{turn.error ?? 'Run interrupted; outcome unknown.'}</p>}
            {!turn.result && turn.state !== 'running' && <button className="text-button" onClick={() => { setTurnId(turn.id); setSelectedNode('waiting') }}>Inspect interrupted request</button>}
          </div>
        </article>)}
      </div>
      <form className="thread-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="thread-claim">Research claim</label><textarea id="thread-claim" value={claim} minLength={5} maxLength={2000} required onChange={e => setClaim(e.target.value)} placeholder="Write a research claim to inspect..." />
        <div className="composer-footer"><button className="primary" disabled={busy || !selectedPapers.length || claim.trim().length < 5}>{busy ? 'Review running...' : 'Send review'} <Icon name="right" /></button></div>
      </form>
    </section>
    <aside className="trace-sidebar"><header><h2>{activeTurn ? 'Follow this review' : 'Your execution tree'}</h2></header>
      {activeTurn ? <><SessionTree turn={activeTurn} selected={currentNode} onSelect={setSelectedNode} /><Inspector key={activeTurn.id + currentNode} turn={activeTurn} selected={currentNode} onSelect={setSelectedNode} /></> : <div className="trace-empty"><Icon name="document" /><p>Claim<br />Search<br />Assessment<br />Source checks</p></div>}
    </aside>
  </main>
}
