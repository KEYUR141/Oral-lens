import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import './CorpusMap.css'

type Source = { id: number; label: string; color: string }
type Point = [number, number, number, number]
type PaperMeta = { id: number; paper_id: string; title: string; source: string; snippet: string }
type Manifest = { sources: Record<string, Source>; points: Point[]; meta: PaperMeta[] }

const mapColors: Record<string, string> = {
  abstract: '#9d9bff',
  fulltext: '#55b7ff',
  figure_captions: '#65dfd0',
}

function validManifest(value: unknown): value is Manifest {
  if (!value || typeof value !== 'object') return false
  const manifest = value as Partial<Manifest>
  return !!manifest.sources && typeof manifest.sources === 'object'
    && Array.isArray(manifest.points) && Array.isArray(manifest.meta)
    && manifest.points.length > 0 && manifest.points.length <= 10000
    && manifest.points.length === manifest.meta.length
    && manifest.points.every(point => Array.isArray(point) && point.length === 4
      && point.every(Number.isFinite))
    && manifest.meta.every(item => item && typeof item.id === 'number'
      && typeof item.title === 'string' && typeof item.source === 'string'
      && typeof item.paper_id === 'string' && typeof item.snippet === 'string')
}

export function CorpusMap({ onClose }: { onClose: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selected, setSelected] = useState<PaperMeta | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [rotating, setRotating] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const priorOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.stopPropagation(); onClose() }
      if (event.key !== 'Tab') return
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.corpus-map-overlay button:not(:disabled)'))
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = priorOverflow
      priorFocus?.focus()
    }
  }, [onClose])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/visualize/manifest', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Corpus map data is unavailable. Check the backend visualization manifest.')
        const data: unknown = await response.json()
        if (!validManifest(data)) throw new Error('Corpus map data has an unexpected format.')
        setManifest(data)
        setError('')
      })
      .catch(reason => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'Corpus map data could not be loaded.')
      })
    return () => controller.abort()
  }, [retry])

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = rotating
  }, [rotating])

  useEffect(() => {
    const host = hostRef.current
    const data = manifest
    if (!data || !host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    } catch {
      setError('This browser cannot display the 3D map. The research workspace remains available.')
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    host.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0c1627')
    scene.fog = new THREE.FogExp2('#0c1627', 0.018)
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(data.points.length * 3)
    const colors = new Float32Array(data.points.length * 3)
    const sourceById = new Map(Object.entries(data.sources).map(([name, source]) => [source.id, name]))
    data.points.forEach((point, index) => {
      positions.set(point.slice(0, 3), index * 3)
      const name = sourceById.get(point[3]) ?? 'abstract'
      new THREE.Color(mapColors[name] ?? '#9d9bff').toArray(colors, index * 3)
    })
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({ size: 0.105, sizeAttenuation: true,
      vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false })
    const cloud = new THREE.Points(geometry, material)
    scene.add(cloud)
    const grid = new THREE.GridHelper(9, 18, '#284567', '#203451')
    grid.position.y = -3.3
    grid.material.transparent = true
    grid.material.opacity = 0.35
    scene.add(grid)

    const radii = data.points.map(point => Math.hypot(point[0], point[1], point[2])).sort((a, b) => a - b)
    const radius = radii[Math.floor(radii.length * 0.95)] ?? 2.4
    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.enablePan = false
    controls.autoRotate = rotating
    controls.autoRotateSpeed = 0.35
    controls.minDistance = radius * 1.1
    controls.maxDistance = radius * 8
    let framed = false
    const resize = () => {
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      camera.aspect = width / height
      if (!framed) {
        const distance = Math.max(4, radius * 2.3 / Math.min(1, camera.aspect))
        camera.position.copy(new THREE.Vector3(0.7, 0.42, 1).normalize().multiplyScalar(distance))
        framed = true
      }
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      controls.update()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const raycaster = new THREE.Raycaster()
    raycaster.params.Points.threshold = 0.14
    const pointer = new THREE.Vector2()
    const pointMeta = data.meta
    function inspectPoint(event: PointerEvent | MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(cloud, false)[0]
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab'
      if (event.type === 'click' && hit?.index !== undefined) setSelected(pointMeta[hit.index])
    }
    function stopRotation() {
      controls.autoRotate = false
      setRotating(false)
    }
    renderer.domElement.addEventListener('pointermove', inspectPoint)
    renderer.domElement.addEventListener('pointerdown', stopRotation)
    renderer.domElement.addEventListener('click', inspectPoint)
    let frame = 0
    const animate = () => {
      frame = window.requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointermove', inspectPoint)
      renderer.domElement.removeEventListener('pointerdown', stopRotation)
      renderer.domElement.removeEventListener('click', inspectPoint)
      controlsRef.current = null
      controls.dispose()
      geometry.dispose()
      material.dispose()
      grid.geometry.dispose()
      grid.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [manifest])

  const sources = manifest ? Object.entries(manifest.sources).sort((a, b) => a[1].id - b[1].id) : []
  const sourceCounts = new Map<number, number>()
  manifest?.points.forEach(point => sourceCounts.set(point[3], (sourceCounts.get(point[3]) ?? 0) + 1))

  return <div className="corpus-map-overlay" role="dialog" aria-modal="true" aria-labelledby="corpus-map-title">
    <header className="corpus-map-header">
      <div><p className="eyebrow">ORAL-LENS / INHERITED CORPUS</p><h2 id="corpus-map-title">Explore the <span>evidence space.</span></h2></div>
      <button ref={closeRef} className="corpus-map-close" type="button" onClick={onClose} aria-label="Close corpus map">Close <span aria-hidden="true">×</span></button>
    </header>
    <div className="corpus-map-stage">
      <div className="corpus-map-frame">
        <div ref={hostRef} className="corpus-map-canvas" role="img" aria-label="3D projection of corpus embeddings; drag to rotate, scroll to zoom, click a point to inspect it" />
        {!manifest && !error && <p className="corpus-map-status" role="status">Loading corpus map...</p>}
        {error && <div className="corpus-map-status" role="alert"><p>{error}</p><button className="secondary" onClick={() => { setError(''); setRetry(value => value + 1) }}>Retry</button></div>}
        <span className="corpus-map-count">{manifest ? `${manifest.points.length.toLocaleString()} corpus points` : 'Corpus map'}</span>
        <div className="corpus-map-controls"><span>Drag to rotate · Scroll to zoom · Select a point</span><button type="button" onClick={() => setRotating(value => !value)} aria-pressed={rotating}>{rotating ? 'Pause rotation' : 'Rotate view'}</button></div>
      </div>
      <aside className="corpus-map-inspector" aria-label="Map details">
        <div className="corpus-map-intro"><p className="eyebrow">MAP READING</p><p>Each point is a stored abstract, full-text excerpt or figure caption. Nearby points are close in this UMAP projection; proximity does not establish scientific agreement.</p></div>
        <div className="corpus-map-legend"><p className="eyebrow">SOURCE TYPES</p>{sources.map(([name, source]) => <div key={name}><span><i style={{ background: mapColors[name] ?? '#9d9bff' }} />{source.label}</span><strong>{sourceCounts.get(source.id)?.toLocaleString() ?? '0'}</strong></div>)}</div>
        <div className="corpus-map-selection" aria-live="polite"><p className="eyebrow">{selected ? 'SELECTED CORPUS POINT' : 'SELECT A POINT'}</p>{selected ? <><h3>{selected.title}</h3><p className="corpus-map-source">{selected.source.replaceAll('_', ' ')} · Corpus row #{selected.id}</p><p className="corpus-map-snippet">{selected.snippet ? `Paper abstract preview: ${selected.snippet}` : 'No abstract preview available for this point.'}</p></> : <p>Click a point in the map to inspect its source record.</p>}</div>
        <p className="corpus-map-provenance">Corpus, embeddings and UMAP coordinates are inherited from the earlier oral cancer project. This presentation is new.</p>
      </aside>
    </div>
  </div>
}
