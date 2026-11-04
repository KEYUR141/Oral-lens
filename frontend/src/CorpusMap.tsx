import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import './CorpusMap.css'

type Source = { id: number; label: string; color: string }
type Point = [number, number, number, number]
type PaperMeta = { id: number; paper_id: string; title: string; source: string; snippet: string }
type Manifest = { sources: Record<string, Source>; points: Point[]; meta: PaperMeta[] }

const mapColors: Record<string, string> = {
  abstract: '#8ca9ff',
  fulltext: '#54a9f7',
  figure_captions: '#69d5db',
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

export function CorpusMap() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selected, setSelected] = useState<PaperMeta | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

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
    renderer.setClearColor('#111b2b')
    host.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(manifest.points.length * 3)
    const colors = new Float32Array(manifest.points.length * 3)
    const sourceById = new Map(Object.entries(manifest.sources).map(([name, source]) => [source.id, name]))
    manifest.points.forEach((point, index) => {
      positions.set(point.slice(0, 3), index * 3)
      const name = sourceById.get(point[3]) ?? 'abstract'
      new THREE.Color(mapColors[name] ?? '#8ca9ff').toArray(colors, index * 3)
    })
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({ size: 0.075, sizeAttenuation: true,
      vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })
    const cloud = new THREE.Points(geometry, material)
    scene.add(cloud)
    const center = new THREE.Vector3()
    const radii = manifest.points.map(point => Math.hypot(point[0], point[1], point[2])).sort((a, b) => a - b)
    const radius = radii[Math.floor(radii.length * 0.95)] ?? 2.4
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.target.copy(center)
    const resize = () => {
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      camera.aspect = width / height
      const distance = Math.max(4, radius * 2.2 / Math.min(1, camera.aspect))
      camera.position.set(center.x, center.y, center.z + distance)
      controls.minDistance = distance * 0.4
      controls.maxDistance = distance * 3
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      controls.update()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const raycaster = new THREE.Raycaster()
    raycaster.params.Points.threshold = 0.11
    const pointMeta = data.meta
    function selectPoint(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(cloud, false)[0]
      if (hit && hit.index !== undefined) setSelected(pointMeta[hit.index])
    }
    renderer.domElement.addEventListener('click', selectPoint)
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
      renderer.domElement.removeEventListener('click', selectPoint)
      controls.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [manifest])

  const sources = manifest ? Object.entries(manifest.sources).sort((a, b) => a[1].id - b[1].id) : []
  return <div className="corpus-map">
    <div className="corpus-map-frame"><div ref={hostRef} className="corpus-map-canvas" role="img" aria-label="3D projection of corpus embeddings; drag to rotate, scroll to zoom, click a point to inspect it" />
      {!manifest && !error && <p className="corpus-map-status" role="status">Loading corpus map...</p>}
      {error && <div className="corpus-map-status" role="alert"><p>{error}</p><button className="secondary" onClick={() => { setError(''); setRetry(value => value + 1) }}>Retry</button></div>}
      <div className="corpus-map-count">{manifest ? `${manifest.points.length.toLocaleString()} corpus points` : 'Corpus map'}</div>
    </div>
    <div className="corpus-map-bottom"><div className="corpus-map-legend">{sources.map(([name, source]) => <span key={name}><i style={{ background: mapColors[name] ?? '#8ca9ff' }} />{source.label}</span>)}</div><p>Drag to rotate. Scroll to zoom. Select a point to inspect its paper.</p></div>
    {selected && <div className="corpus-map-selection" aria-live="polite"><span className="eyebrow">{selected.source.replaceAll('_', ' ')} / CORPUS ROW #{selected.id}</span><h2>{selected.title}</h2><p>{selected.snippet ? `Paper abstract preview: ${selected.snippet}` : 'No abstract preview available for this point.'}</p></div>}
  </div>
}
