import './App.css'

function App() {
  return (
    <main className="workspace">
      <p className="eyebrow">Oral-lens</p>
      <h1>A workspace for reviewing research.</h1>
      <p className="intro">
        The React frontend is ready for development. Study comparison,
        source inspection, and the evidence review workflow will be built here.
      </p>
      <nav aria-label="Existing backend tools">
        <a href="http://127.0.0.1:8000/docs">Explore the API</a>
        <a href="http://127.0.0.1:8000/visualize">Open the existing literature map</a>
      </nav>
      <p className="note">Start the FastAPI backend on port 8000 to use these tools.</p>
    </main>
  )
}

export default App
