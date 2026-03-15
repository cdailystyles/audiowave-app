# AudioWave.app

Real-time audio visualizer with internet radio streaming.

## Project Structure
- `index.html` — Single-page app (HTML + inline JS for visualizer engine)
- `js/radio.js` — Radio streaming module (Radio Browser API)
- `css/styles.css` — All styles (dark theme, responsive)
- `favicon.svg` — SVG favicon
- `CNAME` — Custom domain: audiowave.app

## Deployment
- Hosted on **Cloudflare Pages** — changes go live on push to `main`
- Domain: `audiowave.app` (DNS managed via Cloudflare)
- No build step — static files served directly

## Key Configuration
- **Google Analytics**: `G-GFSBB21QCB` — must remain in `<head>`
- **Google AdSense**: `ca-pub-2337547089019763` — script in `<head>`, ad units in body
- **Cloudflare Pages**: 25 MB per-file limit

## Architecture
- Canvas-based visualizer with 24 pattern types
- Two audio sources: internet radio + tab audio capture (getDisplayMedia)
- Radio uses Radio Browser API (`de1.api.radio-browser.info`)
- Location auto-detect via `ipapi.co` (skipped if user has saved prefs)
- User settings persisted in localStorage (`audiowave-config`, `audiowave-radio`, `audiowave-presets`)
- Responsive with mobile support, ARIA accessibility, reduced-motion support

## Conventions
- No build tools / no npm — pure static HTML/CSS/JS
- CSS custom properties for theming (--accent: #00ffcc)
- Font: JetBrains Mono (Google Fonts)
- All radio state managed in `js/radio.js`, exposed via `window.radioModule`
- Visualizer globals: `window.audioContext`, `window.analyser`, `window.dataArray`, `window.config`

## Workflow
- Always `git pull origin main` before starting work
- Always commit and push when done
- Repo: https://github.com/cdailystyles/audiowave-app.git
