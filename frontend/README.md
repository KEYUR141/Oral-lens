# Oral-lens frontend

React + TypeScript + Vite local demo, with product and presentation views. Product connects to the first draft claim-review API; presentation introduces the problem with sourced statistics. Three.js is installed; the inherited backend visualization remains separate. See [demo walkthrough and sources](../doc/frontend_demo.md).

## Run

From this folder, on Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:5173/#product or http://127.0.0.1:5173/#present. Start the backend separately from the repository root:

```powershell
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Vite proxies `/api/*` to FastAPI on port 8000, removing the `/api` prefix. Corpus status and paper listings load automatically; submitting a claim calls `/reviews/assess` and consumes Meta credits. Presentation content remains usable when the backend is unavailable. Proxy configuration for production deployment is not included.

## Dependencies and checks

- React and React DOM: UI foundation.
- Three.js: installed as `three`; import it from `three` when adding a scene.
- TypeScript, React/Three.js types, and Vite: typed development and build.
- `package-lock.json`: npm dependency lock; use `npm ci` for repeatable installation.
- `npm run build`: TypeScript check and production bundle.
- `npm run lint`: generated starter lint configuration.

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`. No execution-policy change is needed. Other shells can use `npm`.

The backend uses uv; frontend dependencies remain managed by npm. Never copy the root database or model credentials into frontend environment variables. Browser-exposed Vite variables are public. Model calls stay on the backend. Results are unsaved drafts; human acceptance, study comparison and export remain planned. No patient features are included.
