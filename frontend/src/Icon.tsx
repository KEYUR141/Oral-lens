type IconName = 'external' | 'left' | 'right' | 'search' | 'close' | 'fullscreen' | 'lens' | 'document'

const paths: Record<IconName, string> = {
  external: 'M7 17 17 7M7 7h10v10',
  left: 'm12 5-7 7 7 7M5 12h14',
  right: 'm12 5 7 7-7 7M5 12h14',
  search: 'm16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  close: 'm6 6 12 12M6 18 18 6',
  fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  lens: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  document: 'M14 2H5v20h14V7l-5-5v5h5M8 12h8m-8 4h6',
}

/** Decorative SVG; the surrounding control supplies its accessible name. */
export function Icon({ name }: { name: IconName }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={paths[name]} />
  </svg>
}
