import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { Icon } from './Icon'

type Paper = { paper_id: string; title: string; year: number | null; source: string }
type Passage = { passage_id: number; paper_id: string; title: string; text: string; source: string; truncated: boolean }
type Review = {
  claim: string; paper_ids: string[]; status: string; human_review: string; source_validation: string
  assessment: null | { support: string; explanation: string; evidence: { passage_id: number; quote: string }[]; limitations: string[] }
  passages: Passage[]; errors: string[]; events: string[]; model: string | null
  usage: Record<string, number>; provenance_note: string
  search_count: number; stop_reason: string | null; warnings: string[]
}
type Inventory = { distinct_papers: number; total_rows: number }
const sources = {
  world: 'https://gco.iarc.who.int/media/globocan/factsheets/cancers/1-lip-oral-cavity-fact-sheet.pdf',
  india: 'https://gco.iarc.who.int/media/globocan/factsheets/populations/356-india-fact-sheet.pdf',
}
const readable = (value: string) => value.replaceAll('_', ' ')
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, options)
  if (!response.ok) throw new Error(`Request failed (${response.status}). Check the backend and API docs.`)
  return response.json() as Promise<T>
}

function Workspace() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [selected, setSelected] = useState<Paper[]>([])
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [paperError, setPaperError] = useState('')
  const [claim, setClaim] = useState('')
  const [running, setRunning] = useState(false)
  const [review, setReview] = useState<Review | null>(null)
  const [runError, setRunError] = useState('')
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [inventoryError, setInventoryError] = useState(false)
  const [activePassage, setActivePassage] = useState<number | null>(null)
  const [copyMessage, setCopyMessage] = useState('')
  const searchRequest = useRef(0)
  async function loadPapers(term = '', page = 0) {
    const requestId = ++searchRequest.current
    setLoading(true); setPaperError('')
    try {
      const data = await api<{ items: Paper[] }>(`/papers?limit=12&offset=${page}&search=${encodeURIComponent(term)}`)
      if (requestId === searchRequest.current) { setPapers(data.items); setOffset(page); setSearchTerm(term) }
    } catch (error) {
      if (requestId === searchRequest.current) { setPapers([]); setPaperError((error as Error).message) }
    } finally { if (requestId === searchRequest.current) setLoading(false) }
  }
  useEffect(() => {
    void loadPapers()
    let active = true
    api<Inventory>('/database/status').then(data => { if (active) setInventory(data) })
      .catch(() => { if (active) setInventoryError(true) })
    return () => { active = false; searchRequest.current++ }
  }, [])
  async function run(event: FormEvent) {
    event.preventDefault()
    if (running || !selected.length || claim.trim().length < 5) return
    setRunning(true); setRunError(''); setReview(null); setActivePassage(null)
    try {
      setReview(await api<Review>('/reviews/assess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claim.trim(), paper_ids: selected.map(p => p.paper_id) }),
      }))
    } catch (error) { setRunError((error as Error).message) }
    finally { setRunning(false) }
  }
  function toggle(paper: Paper) {
    setSelected(previous => previous.some(p => p.paper_id === paper.paper_id)
      ? previous.filter(p => p.paper_id !== paper.paper_id) : previous.length < 10 ? [...previous, paper] : previous)
    setReview(null)
  }
  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ claim: claim.trim(), paper_ids: selected.map(p => p.paper_id) }, null, 2))
      setCopyMessage('Request JSON copied.')
    } catch { setCopyMessage('Clipboard unavailable. The request JSON is shown below.') }
  }
  return <main id="workspace-main" className="product container">
    <div className="page-intro"><div><p className="eyebrow">PRODUCT DEMO / RESEARCH WORKSPACE</p>
      <h1>Follow the evidence.</h1><p className="muted">Review a literature claim against the papers you choose.</p></div>
      <div className="inventory"><span className={`status-dot ${inventory ? 'connected' : ''}`} />
        {inventory ? `${inventory.distinct_papers} papers / ${inventory.total_rows.toLocaleString()} passages` : inventoryError ? 'Corpus unavailable' : 'Connecting to corpus...'}
      </div></div>
    <div className="work-grid">
      <aside className="panel corpus"><div className="panel-heading"><div><p className="eyebrow">01 / SCOPE</p><h2>Your literature</h2></div><span className="counter">{selected.length}/10</span></div>
        <form className="search" onSubmit={event => { event.preventDefault(); void loadPapers(query) }}>
          <label className="sr-only" htmlFor="paper-search">Search paper titles</label>
          <input id="paper-search" value={query} maxLength={300} onChange={event => setQuery(event.target.value)} placeholder="Search paper titles" />
          <button className="icon-button" disabled={loading} aria-label="Search papers"><Icon name="search" /></button>
        </form>
        {selected.length > 0 && <div className="selected-list" aria-label="Selected papers">{selected.map(p => <button disabled={running} key={p.paper_id} onClick={() => toggle(p)} title={`Remove ${p.title}`}>{p.title.slice(0, 34)}... <Icon name="close" /></button>)}</div>}
        <p className="small muted">Choose up to 10 papers. Search uses paper titles.</p>
        <div className="paper-list" aria-busy={loading}>
          {loading ? <p className="empty">Loading papers...</p> : paperError ? <p className="notice error" role="alert">{paperError}</p> : !papers.length ? <p className="empty">No papers found. Try another title.</p> : papers.map(paper => {
            const checked = selected.some(p => p.paper_id === paper.paper_id)
            return <label className={`paper ${checked ? 'selected' : ''}`} key={paper.paper_id}>
              <input type="checkbox" checked={checked} disabled={running || (!checked && selected.length >= 10)} onChange={() => toggle(paper)} />
              <span><span className="paper-meta">{paper.year ?? 'Year unavailable'} / {readable(paper.source)}</span><span className="paper-title">{paper.title}</span></span>
            </label>
          })}
        </div>
        <div className="pagination"><button className="text-button" disabled={!offset || loading} onClick={() => void loadPapers(searchTerm, Math.max(0, offset - 12))}><Icon name="left" /> Previous</button><button className="text-button" disabled={papers.length < 12 || loading} onClick={() => void loadPapers(searchTerm, offset + 12)}>Next <Icon name="right" /></button></div>
      </aside>
      <section className="review-column">
        <form className="panel claim-panel" onSubmit={run}>
          <p className="eyebrow">02 / DRAFT CLAIM</p><h2>What does the literature support?</h2>
          <label htmlFor="claim">Enter one research statement to inspect</label>
          <textarea id="claim" value={claim} maxLength={2000} minLength={5} required disabled={running} onChange={event => { setClaim(event.target.value); setReview(null) }} placeholder="For example: The selected studies used comparable specimen types and outcome measures." />
          <div className="claim-footer"><span className="small muted">{claim.length}/2,000 / Research literature only</span><button className="primary" disabled={running || selected.length === 0 || claim.trim().length < 5}>{running ? 'Review running...' : <>Review evidence <Icon name="external" /></>}</button></div>
          <p className="small muted">Runs use Meta API credits. Results are drafts and are not saved. Do not enter patient information.</p>
        </form>
        <section className="panel results" aria-live="polite" aria-busy={running}>
          <div className="panel-heading"><div><p className="eyebrow">03 / EVIDENCE REVIEW</p><h2>{review ? 'Inspect the result.' : 'A claim is a starting point.'}</h2></div><span className="tag">Draft</span></div>
          {running ? <div className="empty"><span className="spinner" /><h3>Inspecting selected literature</h3><p>Scope check, passage search, assessment, source checks. One follow-up search may run if evidence is missing.</p><p className="small">Waiting for the backend. Progress events appear when it returns.</p></div>
            : runError ? <p className="notice error" role="alert">{runError} The run outcome could not be confirmed. Check the backend before retrying.</p>
            : !review ? <div className="empty"><div className="evidence-glyph" aria-hidden="true"><Icon name="document" /></div><h3>Choose papers. Add a claim.</h3><p>Your assessment and exact source passages will appear here.</p><div className="three-steps"><span>Model assessment</span><span>Source checks</span><span>Human inspection</span></div></div>
            : <>
              <div className="result-badges"><span className={`tag ${review.status === 'failed' ? 'bad' : 'blue'}`}>{readable(review.status)}</span><span className="tag">Source checks: {readable(review.source_validation)}</span><span className="tag">Human: {readable(review.human_review)}</span></div>
              <p className="small muted">Searches: {review.search_count ?? 1}/2 {review.stop_reason ? `/ ${readable(review.stop_reason)}` : ''}</p>
              {(review.warnings ?? []).map((warning, index) => <p className="notice" key={index}>{warning}</p>)}
              {review.errors.length > 0 && <div className="notice error"><strong>{review.status === 'out_of_scope' ? 'Outside research scope' : 'Review incomplete'}</strong><ul>{review.errors.map((error, index) => <li key={index}>{readable(error)}</li>)}</ul></div>}
              {review.assessment && <div className="assessment"><p className="eyebrow">MODEL ASSESSMENT / {readable(review.assessment.support)}</p><p className="assessment-text">{review.assessment.explanation}</p>
                {review.assessment.evidence.map((evidence, index) => <a className="quote-link" key={index} href={`#passage-${evidence.passage_id}`} onClick={event => { event.preventDefault(); setActivePassage(evidence.passage_id); requestAnimationFrame(() => document.getElementById(`passage-${evidence.passage_id}`)?.scrollIntoView({ block: 'nearest' })) }}><span className="small">Passage #{evidence.passage_id} <Icon name="external" /></span><q>{evidence.quote}</q></a>)}
                <h3>Limits of this assessment</h3><ul className="muted">{review.assessment.limitations.map((limit, index) => <li key={index}>{limit}</li>)}</ul></div>}
              {review.passages.length > 0 && <div className="passages"><h3>Source passages <span className="muted">/ {review.passages.length}</span></h3>{review.passages.map(passage => <details className="passage" id={`passage-${passage.passage_id}`} key={passage.passage_id} open={activePassage === passage.passage_id} onToggle={event => { if (!event.currentTarget.open && activePassage === passage.passage_id) setActivePassage(null) }}><summary><span className="paper-meta">#{passage.passage_id} / {readable(passage.source)}{passage.truncated ? ' / Excerpt truncated' : ''}</span><span>{passage.title}</span></summary><p className="source-text">{passage.text}</p></details>)}</div>}
              <p className="small muted">{review.provenance_note}</p>
              <details className="run-details"><summary>Run details & CLI comparison</summary><p className="small">{review.model ?? 'No model reported'} / {review.usage.total_tokens ?? 'Unavailable'} total tokens</p><p className="small">Completed events: {review.events.map(readable).join(' -> ') || 'None'}</p><pre>{JSON.stringify(review, null, 2)}</pre></details>
            </>}
        </section>
        <details className="panel cli"><summary>Test the same request in the CLI or API docs</summary><p className="small muted">Copy the JSON body for POST /reviews/assess. It contains your current claim and selected IDs.</p><pre>{JSON.stringify({ claim: claim.trim(), paper_ids: selected.map(p => p.paper_id) }, null, 2)}</pre><button className="secondary" onClick={() => void copyRequest()}>Copy request JSON</button> <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">Open API docs <Icon name="external" /></a><p className="small" role="status">{copyMessage}</p></details>
      </section>
    </div>
  </main>
}
const chapters = ['The context', 'The research task', 'The workflow', 'The live product']
function Presentation({ onProduct }: { onProduct: () => void }) {
  const [slide, setSlide] = useState(0)
  const [fullscreenError, setFullscreenError] = useState('')
  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return
      if (event.key === 'ArrowRight') { event.preventDefault(); setSlide(s => Math.min(3, s + 1)) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setSlide(s => Math.max(0, s - 1)) }
    }
    window.addEventListener('keydown', keys)
    return () => window.removeEventListener('keydown', keys)
  }, [])
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() }
    catch { setFullscreenError('Fullscreen unavailable. Use your browser fullscreen control.') }
  }
  return <main id="presentation-main" className="presentation container">
    <div className="present-toolbar"><p className="eyebrow">ORAL-LENS / THE STORY</p><button className="text-button" onClick={() => void fullscreen()}>Fullscreen <Icon name="fullscreen" /></button></div>
    <div className="slide-stage">
      <nav className="chapter-dots" aria-label="Presentation chapters">{chapters.map((chapter, index) => <button key={chapter} className={slide === index ? 'active' : ''} onClick={() => setSlide(index)} aria-label={`Chapter ${index + 1}: ${chapter}`} aria-current={slide === index ? 'step' : undefined}><span /> <span className="sr-only">{chapter}</span></button>)}</nav>
      <section className="slide" key={slide} aria-live="polite">
        {slide === 0 && <><p className="eyebrow">01 / THE CONTEXT</p><h1>Research matters.<br /><span className="blue-text">Every source matters.</span></h1><p className="slide-lead">The burden of lip and oral cavity cancer gives this research its urgency.</p>
          <div className="stat-grid"><article><p className="stat-number">194,108</p><p>Estimated deaths worldwide</p><a href={sources.world} target="_blank" rel="noreferrer">IARC - Global fact sheet <Icon name="external" /></a></article><article><p className="stat-number">86,307</p><p>Estimated deaths in India</p><a href={sources.india} target="_blank" rel="noreferrer">IARC - India fact sheet, p. 2 <Icon name="external" /></a></article></div>
          <p className="small muted">GLOBOCAN 2024 estimates / Both sexes / All ages / Lip and oral cavity, not all head and neck cancers. Sources accessed 29 October 2026.</p>
        </>}
        {slide === 1 && <><p className="eyebrow">02 / THE RESEARCH TASK</p><h1>Finding a paper<br />is the beginning.</h1><p className="slide-lead">For medical students, researchers and doctors reviewing literature, the next task is connecting a conclusion to what the studies actually report.</p><div className="task-grid">{[['01', 'Inspect the source', 'Does this passage support the claim, or merely mention the topic?'], ['02', 'Compare carefully', 'Do populations, specimen types and outcome measures align?'], ['03', 'Keep the limits', 'What is missing from the available abstracts and excerpts?']].map(([number, title, text]) => <article key={number}><span className="eyebrow">{number}</span><h2>{title}</h2><p className="muted">{text}</p></article>)}</div><p className="small muted">Our design hypothesis: make evidence inspection easier. Time savings and research-quality improvements have not yet been measured.</p></>}
        {slide === 2 && <><p className="eyebrow">03 / THE WORKFLOW</p><h1>A claim.<br />An inspectable trail.</h1><p className="slide-lead">Meta assesses the selected excerpts. Application checks keep the source references visible. The researcher inspects the draft.</p><div className="workflow-strip">{['Select papers', 'Draft a claim', 'Inspect evidence', 'Check sources'].map((label, index) => <article key={label}><span className="eyebrow">0{index + 1}</span><h2>{label}</h2>{index < 3 && <span className="flow-arrow" aria-hidden="true"><Icon name="right" /></span>}</article>)}</div><div className="scope-note"><strong>Three separate judgments</strong><p>Model interpretation / Mechanical source checks / Human review</p><p className="small muted">A quote match does not establish scientific truth. Current results remain unreviewed drafts.</p></div></>}
        {slide === 3 && <><p className="eyebrow">04 / THE LIVE PRODUCT</p><h1>From a statement<br />to its <span className="blue-text">sources.</span></h1><p className="slide-lead">Open the workspace, select real papers and inspect a claim against the retrieved passages.</p><div className="demo-actions"><button className="primary" onClick={onProduct}>Open product demo <Icon name="external" /></button><a className="secondary" href="http://127.0.0.1:8000/visualize" target="_blank" rel="noreferrer">Explore inherited corpus map <Icon name="external" /></a></div><div className="scope-note"><p><strong>New:</strong> bounded claim-review workflow, source checks and this React interface.</p><p className="muted"><strong>Inherited:</strong> corpus, embedding infrastructure and existing 3D map.</p><p className="small muted">Local prototype. Saved corrections, study comparison and export are still planned. Research use only; no patient assessment or medical advice.</p></div></>}
      </section>
    </div>
    <footer className="slide-footer"><span className="small muted">{String(slide + 1).padStart(2, '0')} / 04 <span className="footer-chapter">- {chapters[slide]}</span></span><div className="slide-progress" aria-hidden="true">{chapters.map((chapter, i) => <span key={chapter} className={i <= slide ? 'filled' : ''} />)}</div><div><button className="text-button" disabled={slide === 0} onClick={() => setSlide(slide - 1)}><Icon name="left" /> Previous</button><button className="secondary" disabled={slide === 3} onClick={() => setSlide(slide + 1)}>Next <Icon name="right" /></button></div></footer>
    <p className="small muted" role="status">{fullscreenError || 'Use the arrow keys or chapter controls to navigate.'}</p>
  </main>
}
function App() {
  const [mode, setMode] = useState(() => window.location.hash === '#present' ? 'present' : 'product')
  useEffect(() => {
    function navigate() { setMode(window.location.hash === '#present' ? 'present' : 'product') }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  function navigate(next: string) { setMode(next); window.location.hash = next; window.scrollTo(0, 0) }
  return <><a className="skip-link" href={mode === 'product' ? '#workspace-main' : '#presentation-main'} onClick={event => { event.preventDefault(); document.getElementById(mode === 'product' ? 'workspace-main' : 'presentation-main')?.scrollIntoView() }}>Skip to content</a><header className="site-header"><a className="brand" href="#product" onClick={() => navigate('product')}><span className="brand-symbol" aria-hidden="true"><Icon name="lens" /></span> Oral-lens<span className="brand-divider" /><span className="brand-label">Research workspace</span></a><nav aria-label="Demo mode"><button className={mode === 'product' ? 'active' : ''} aria-current={mode === 'product' ? 'page' : undefined} onClick={() => navigate('product')}>Product</button><button className={mode === 'present' ? 'active' : ''} aria-current={mode === 'present' ? 'page' : undefined} onClick={() => navigate('present')}>Present <Icon name="external" /></button></nav><span className="header-note">Built with Meta AI</span></header>
    <div hidden={mode !== 'product'}><Workspace /></div>{mode === 'present' && <Presentation onProduct={() => navigate('product')} />}
    <footer className="site-footer container"><span>Oral-lens / Literature research prototype</span><span>Draft assessments / Source inspection</span></footer></>
}
export default App
