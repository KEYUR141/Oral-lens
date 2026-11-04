import { useEffect, useState } from 'react'
import './App.css'
import { Icon } from './Icon'
import Workbench from './Workbench'
const sources = {
  world: 'https://gco.iarc.who.int/media/globocan/factsheets/cancers/1-lip-oral-cavity-fact-sheet.pdf',
  india: 'https://gco.iarc.who.int/media/globocan/factsheets/populations/356-india-fact-sheet.pdf',
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
        {slide === 0 && <><p className="eyebrow">01 / THE CONTEXT</p><h1>Research matters.<br /><span className="blue-text">Every source matters.</span></h1>
          <div className="stat-grid"><article><p className="stat-number">194,108</p><p>Estimated deaths worldwide</p><a href={sources.world} target="_blank" rel="noreferrer">IARC - Global fact sheet <Icon name="external" /></a></article><article><p className="stat-number">86,307</p><p>Estimated deaths in India</p><a href={sources.india} target="_blank" rel="noreferrer">IARC - India fact sheet, p. 2 <Icon name="external" /></a></article></div>
          <h2 className="stat-scope">Lip and oral cavity / 2024 estimates</h2><details className="small"><summary>Sources</summary><p>GLOBOCAN 2024 / Both sexes / All ages / Sources accessed 29 October 2026.</p></details>
        </>}
        {slide === 1 && <><p className="eyebrow">02 / THE RESEARCH TASK</p><h1>Finding a paper<br />is the beginning.</h1><div className="task-grid">{[['01', 'Inspect the source', 'Does this passage support the claim, or merely mention the topic?'], ['02', 'Compare carefully', 'Do populations, specimen types and outcome measures align?'], ['03', 'Keep the limits', 'What is missing from the available abstracts and excerpts?']].map(([number, title]) => <article key={number}><span className="eyebrow">{number}</span><h2>{title}</h2></article>)}</div></>}
        {slide === 2 && <><p className="eyebrow">03 / THE WORKFLOW</p><h1>A claim.<br />An inspectable trail.</h1><div className="workflow-strip">{['Select papers', 'Draft a claim', 'Inspect evidence', 'Check sources'].map((label, index) => <article key={label}><span className="eyebrow">0{index + 1}</span><h2>{label}</h2>{index < 3 && <span className="flow-arrow" aria-hidden="true"><Icon name="right" /></span>}</article>)}</div></>}
        {slide === 3 && <><p className="eyebrow">04 / THE LIVE PRODUCT</p><h1>From a statement<br />to its <span className="blue-text">sources.</span></h1><div className="demo-actions"><button className="primary" onClick={onProduct}>Open product demo <Icon name="external" /></button><a className="secondary" href="http://127.0.0.1:8000/visualize" target="_blank" rel="noreferrer">Explore inherited corpus map <Icon name="external" /></a></div><details className="contribution-details"><summary>Contributions</summary><p>New: claim-review workflow, source checks and React interface.</p><p>Inherited: corpus, embeddings and 3D map.</p></details></>}
      </section>
    </div>
    <footer className="slide-footer"><span className="small muted">{String(slide + 1).padStart(2, '0')} / 04 <span className="footer-chapter">- {chapters[slide]}</span></span><div className="slide-progress" aria-hidden="true">{chapters.map((chapter, i) => <span key={chapter} className={i <= slide ? 'filled' : ''} />)}</div><div><button className="text-button" disabled={slide === 0} onClick={() => setSlide(slide - 1)}><Icon name="left" /> Previous</button><button className="secondary" disabled={slide === 3} onClick={() => setSlide(slide + 1)}>Next <Icon name="right" /></button></div></footer>
    <p role="status">{fullscreenError}</p>
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
