# Oral-lens frontend

React + TypeScript + Vite foundation, with Three.js installed for future visualization work. This is a local starter, not the completed evidence-review interface. It does not replace the inherited backend visualization.

## Run

From this folder, on Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:5173. Start the backend separately from the repository root:

```powershell
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Vite proxies `/api/*` to FastAPI on port 8000, removing the `/api` prefix. For example, frontend requests to `/api/database/status` reach the existing `/database/status` endpoint. The initial starter does not fetch database records automatically.

## Dependencies and checks

- React and React DOM: UI foundation.
- Three.js: installed as `three`; import it from `three` when adding a scene.
- TypeScript, React/Three.js types, and Vite: typed development and build.
- `package-lock.json`: npm dependency lock; use `npm ci` for repeatable installation.
- `npm run build`: TypeScript check and production bundle.
- `npm run lint`: generated starter lint configuration.

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`. No execution-policy change is needed. Other shells can use `npm`.

The backend uses uv; frontend dependencies remain managed by npm. Never copy the root database or model credentials into frontend environment variables. Browser-exposed Vite variables are public. No model API calls, patient features, or new review capabilities are implemented by this setup.
