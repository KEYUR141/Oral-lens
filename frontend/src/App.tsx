import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { Icon } from './Icon'
import Workbench from './Workbench'
const CorpusMap = lazy(() => import('./CorpusMap').then(module => ({ default: module.CorpusMap })))
const sources = {
  world: 'https://gco.iarc.who.int/media/globocan/factsheets/cancers/1-lip-oral-cavity-fact-sheet.pdf',
  india: 'https://gco.iarc.who.int/media/globocan/factsheets/populations/356-india-fact-sheet.pdf',
}
type CorpusSource = { source: string; rows: number; papers: number }
type CorpusStatus = { total_rows: number; distinct_papers: number; rows_by_source: CorpusSource[] }
const corpusSnapshot: CorpusStatus = {
  total_rows: 4666, distinct_papers: 146,
  rows_by_source: [
    { source: 'abstract', rows: 146, papers: 146 },
    { source: 'fulltext', rows: 4117, papers: 79 },
    { source: 'figure_captions', rows: 403, papers: 72 },
  ],
}
const chapters = ['The context', 'Research corpus', 'Review task', 'Review workflow', 'What changed', 'Live product']
function isCorpusStatus(value: unknown): value is CorpusStatus {
  if (!value || typeof value !== 'object') return false
  const status = value as Partial<CorpusStatus>
  const database = value as Record<string, unknown>
  return database.papers_table_exists === true && database.inspection_read_only === true
    && Number.isInteger(status.total_rows) && Number(status.total_rows) >= 0
    && Number.isInteger(status.distinct_papers) && Number(status.distinct_papers) >= 0
    && Array.isArray(status.rows_by_source)
    && status.rows_by_source.every(row => typeof row.source === 'string'
      && Number.isInteger(row.rows) && row.rows >= 0
      && Number.isInteger(row.papers) && row.papers >= 0)
}
function CorpusInventory({ status, live, loading, titles }: { status: CorpusStatus; live: boolean; loading: boolean; titles: { title: string; year: number | null }[] }) {
  const types = [
    ['abstract', 'Abstracts'], ['fulltext', 'Full-text chunks'], ['figure_captions', 'Figure captions'],
  ]
  const fulltext = status.rows_by_source.find(row => row.source === 'fulltext')
  return <>
    <p className="eyebrow">02 / RESEARCH CORPUS</p>
    <h1 className="corpus-headline"><span className="blue-text">{status.distinct_papers.toLocaleString()} papers.</span><br />{status.total_rows.toLocaleString()} stored rows.</h1>
    <p className="slide-lead">A row is an abstract or extracted passage. The row count is not a count of distinct studies.</p>
    <p className="inventory-state" role="status">{live ? 'LIVE / READ-ONLY DATABASE' : loading ? 'CHECKING LIVE DATABASE / SHOWING VERIFIED SNAPSHOT FROM 5 NOV 2026' : 'VERIFIED READ-ONLY SNAPSHOT / 5 NOV 2026 · LIVE DATABASE UNAVAILABLE'}</p>
    <div className="corpus-sources">{types.map(([key, label]) => {
      const record = status.rows_by_source.find(row => row.source === key)
      const papers = record?.papers ?? 0
      return <article key={key}><h2>{label}</h2><strong>{(record?.rows ?? 0).toLocaleString()} <small>rows</small></strong><p>{papers.toLocaleString()} of {status.distinct_papers.toLocaleString()} papers represented</p><div className="coverage-track" aria-hidden="true"><span style={{ width: `${status.distinct_papers ? Math.min(100, papers / status.distinct_papers * 100) : 0}%` }} /></div></article>
    })}</div>
    <p className="corpus-caveat">{Math.max(0, status.distinct_papers - (fulltext?.papers ?? 0)).toLocaleString()} papers have no stored full-text rows. Stored text and embeddings do not establish paper completeness or scientific validity.</p>
    {live && titles.length > 0 && <div className="corpus-examples"><span className="eyebrow">EXAMPLE RECORDS / TITLE MATCHES “ORAL”</span>{titles.map((paper, index) => <p key={`${paper.title}-${index}`}>{paper.title} <span>{paper.year ?? 'Year unknown'}</span></p>)}</div>}
  </>
}
function ProjectComparison() {
  const rows = [
    ['Task', 'Answer a research question', 'Check a draft claim against selected papers'],
    ['Evidence', 'Paper-level matches; abstracts supplied to generation', 'Exact retrieved passages; bounded follow-up across selected papers'],
    ['Model', 'Gemini generates an answer', 'Meta drafts an assessment; source checks stay separate'],
    ['Review', 'Answer and source list', 'Explicit evidence gaps, run trail, and human-review boundary'],
  ]
  return <>
    <p className="eyebrow">05 / OLD PROJECT → ORAL-LENS</p>
    <h1 className="comparison-headline">The task changed from <span className="blue-text">answering</span> to <span className="blue-text">checking.</span></h1>
    <div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>Dimension</th><th>Oral Cancer X / observed baseline</th><th>Oral-lens / implemented</th></tr></thead><tbody>{rows.map(([dimension, old, current]) => <tr key={dimension}><th scope="row">{dimension}</th><td>{old}</td><td>{current}</td></tr>)}</tbody></table></div>
    <p className="comparison-provenance"><strong>Inherited:</strong> corpus, embeddings and UMAP projection. <strong>Still planned:</strong> saved corrections, study comparison table and export.</p>
    <a className="comparison-source" href="https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/tree/26749ed838fdcade14307e6314f3abf20543f404" target="_blank" rel="noreferrer">Inspect the earlier project baseline <Icon name="external" /></a>
  </>
}
function Presentation({ onProduct }: { onProduct: () => void }) {
  const [slide, setSlide] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')
  const [liveCorpus, setLiveCorpus] = useState<CorpusStatus | null>(null)
  const [corpusLoading, setCorpusLoading] = useState(false)
  const [paperExamples, setPaperExamples] = useState<{ title: string; year: number | null }[]>([])
  useEffect(() => {
    if (slide !== 1) return
    const controller = new AbortController()
    setCorpusLoading(true)
    setLiveCorpus(null)
    setPaperExamples([])
    fetch('/api/database/status', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Database status unavailable')
        const value: unknown = await response.json()
        if (!isCorpusStatus(value)) throw new Error('Unexpected database status')
        if (!controller.signal.aborted) setLiveCorpus(value)
      })
      .catch(() => { if (!controller.signal.aborted) setLiveCorpus(null) })
      .finally(() => { if (!controller.signal.aborted) setCorpusLoading(false) })
    fetch('/api/papers?search=oral&limit=2&offset=0', { signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then((value: unknown) => {
        if (controller.signal.aborted || !value || typeof value !== 'object') return
        const items = (value as { items?: unknown }).items
        if (!Array.isArray(items)) return
        setPaperExamples(items.filter((item): item is { title: string; year: number | null } =>
          !!item && typeof item.title === 'string' && (item.year === null || Number.isInteger(item.year))).slice(0, 2))
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [slide])
  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return
      if (event.key === 'ArrowRight') { event.preventDefault(); setMapOpen(false); setSlide(s => Math.min(chapters.length - 1, s + 1)) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setMapOpen(false); setSlide(s => Math.max(0, s - 1)) }
    }
    window.addEventListener('keydown', keys)
    return () => window.removeEventListener('keydown', keys)
  }, [])
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() }
    catch { setFullscreenError('Fullscreen unavailable. Use your browser fullscreen control.') }
  }
  return <main id="presentation-main" className="presentation container">
    <div className="present-toolbar"><p className="eyebrow">ORAL-LENS / RESEARCH DEMO</p><button className="text-button" onClick={() => void fullscreen()}>Fullscreen <Icon name="fullscreen" /></button></div>
    <div className="slide-stage">
      <nav className="chapter-dots" aria-label="Presentation chapters">{chapters.map((chapter, index) => <button key={chapter} className={slide === index ? 'active' : ''} onClick={() => { setMapOpen(false); setSlide(index) }} aria-label={`Chapter ${index + 1}: ${chapter}`} aria-current={slide === index ? 'step' : undefined}><span /> <span className="sr-only">{chapter}</span></button>)}</nav>
      <section className="slide" key={slide} aria-live="polite">
        {slide === 0 && <><p className="eyebrow">01 / RESEARCH CONTEXT</p><h1>Oral cancer: <span className="blue-text">2024 burden.</span></h1><p className="slide-lead">Estimated deaths from lip and oral cavity cancer. These population figures motivate research; they do not measure this product's impact.</p>
          <div className="stat-grid"><article><p className="stat-number">194,108</p><p>Estimated deaths worldwide</p><a href={sources.world} target="_blank" rel="noreferrer">IARC - Global fact sheet <Icon name="external" /></a></article><article><p className="stat-number">86,307</p><p>Estimated deaths in India</p><a href={sources.india} target="_blank" rel="noreferrer">IARC - India fact sheet, p. 2 <Icon name="external" /></a></article></div>
          <h2 className="stat-scope">Lip and oral cavity / 2024 estimates</h2><details className="small"><summary>Sources</summary><p>GLOBOCAN 2024 / Both sexes / All ages / Sources accessed 29 October 2026.</p></details>
        </>}
        {slide === 1 && <CorpusInventory status={liveCorpus ?? corpusSnapshot} live={!!liveCorpus} loading={corpusLoading} titles={paperExamples} />}
        {slide === 2 && <><p className="eyebrow">03 / THE REVIEW TASK</p><h1>Three checks before<br />a claim is usable.</h1><p className="slide-lead">The user chooses the papers and a draft claim. The app checks retrieved excerpts within that scope.</p><div className="task-grid">{[['01', 'Inspect exact text', 'Does a passage support the statement, or only mention its topic?'], ['02', 'Compare scope', 'Do the available specimen types and outcomes line up?'], ['03', 'Name the gap', 'What cannot be established from the available excerpts?']].map(([number, title, description]) => <article key={number}><span className="eyebrow">{number}</span><h2>{title}</h2><p className="muted">{description}</p></article>)}</div></>}
        {slide === 3 && <><p className="eyebrow">04 / IMPLEMENTED WORKFLOW</p><h1>A bounded, <span className="blue-text">inspectable review.</span></h1><p className="slide-lead">Selected-paper search supplies passages. Meta drafts an assessment; the app checks source references and can search again when evidence is missing.</p><div className="workflow-strip">{['Select papers', 'Retrieve passages', 'Meta draft + follow-up', 'Check sources'].map((label, index) => <article key={label}><span className="eyebrow">0{index + 1}</span><h2>{label}</h2>{index < 3 && <span className="flow-arrow" aria-hidden="true"><Icon name="right" /></span>}</article>)}</div><p className="workflow-limit">A draft can report insufficient evidence. It does not set human-reviewed status or prove a scientific claim.</p></>}
        {slide === 4 && <ProjectComparison />}
        {slide === 5 && <><p className="eyebrow">06 / THE LIVE PRODUCT</p><h1>Run a <span className="blue-text">claim review.</span></h1><p className="slide-lead">Select papers, inspect source passages and follow-up searches, then review the draft assessment and its limits.</p><div className="demo-actions"><button className="primary" onClick={onProduct}>Open product demo <Icon name="external" /></button><button className="secondary" onClick={() => setMapOpen(true)}>Explore inherited corpus map <Icon name="right" /></button></div><details className="contribution-details"><summary>Contributions</summary><p>New: claim-review workflow, source checks and React interface, including this map presentation.</p><p>Inherited: corpus, embeddings, UMAP projection and original visualization.</p></details></>}
      </section>
    </div>
    <footer className="slide-footer"><span className="small muted">{String(slide + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')} <span className="footer-chapter">- {chapters[slide]}</span></span><div className="slide-progress" aria-hidden="true">{chapters.map((chapter, i) => <span key={chapter} className={i <= slide ? 'filled' : ''} />)}</div><div><button className="text-button" disabled={slide === 0} onClick={() => { setMapOpen(false); setSlide(slide - 1) }}><Icon name="left" /> Previous</button><button className="secondary" disabled={slide === chapters.length - 1} onClick={() => { setMapOpen(false); setSlide(slide + 1) }}>Next <Icon name="right" /></button></div></footer>
    <p role="status">{fullscreenError}</p>
    {mapOpen && <Suspense fallback={<p role="status">Loading map view...</p>}><CorpusMap onClose={() => setMapOpen(false)} /></Suspense>}
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
  return <><a className="skip-link" href={mode === 'product' ? '#workspace-main' : '#presentation-main'} onClick={event => { event.preventDefault(); document.getElementById(mode === 'product' ? 'workspace-main' : 'presentation-main')?.scrollIntoView() }}>Skip to content</a><header className="site-header"><a className="brand" href="#product" onClick={() => navigate('product')}><span className="brand-symbol" aria-hidden="true"><Icon name="lens" /></span> Oral-lens</a><nav aria-label="Demo mode"><button className={mode === 'product' ? 'active' : ''} aria-current={mode === 'product' ? 'page' : undefined} onClick={() => navigate('product')}>Product</button><button className={mode === 'present' ? 'active' : ''} aria-current={mode === 'present' ? 'page' : undefined} onClick={() => navigate('present')}>Present <Icon name="external" /></button></nav><span className="header-note" aria-hidden="true" /></header>
    <div hidden={mode !== 'product'}><Workbench /></div>{mode === 'present' && <Presentation onProduct={() => navigate('product')} />}
    </>
}
export default App
