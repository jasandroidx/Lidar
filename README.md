# Pike County Terrain Radar (Pike Terrain Keep)

An interactive, file-backed LiDAR and historical mapping Progressive Web Application (PWA) for exploring pioneer homesteads, cellar holes, cisterns, and sunken traces in Pike County, Indiana.

## Overview

Pike County Terrain Radar combines real Esri World Imagery photography with high-contrast LiDAR Local Relief Model (LRM) overlays, automated morphological detection targets, and 1885 Goodspeed archival history notes.

- **Basemap:** Esri World Imagery photography (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`)
- **LRM Canopy Peel:** Adjust dynamic opacity over `lrm_overlay.png` to peer beneath tree canopy
- **Field Triage:** Verdict logging (`confirmed`, `walkover`, `rejected`) stored locally in SQLite (`reviews.db`)
- **Export Capabilities:** Export survey waypoints to GPX (for Gaia/OnX) and Obsidian Markdown dossiers

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Lucide Icons, Vite PWA
- **Backend:** Standalone Python standard library HTTP server (`server.py`) running on port 8150
- **Database:** SQLite (`reviews.db`) for verdict and note persistence

## Running the Application

### 1. Start the Backend API Server

```bash
python3 server.py --candidates /workspace/bot-floor/bot_a_excavator/candidates.geojson --chips /workspace/bot-floor/bot_a_excavator/chips --vault /root/obsidian_vault --port 8150
```

The backend server serves static distribution files (`dist/` or repository root) and exposes REST endpoints at `/api/*`.

### 2. Run the Development Web Server (Optional)

```bash
bun run dev
# or
npm run dev
```

### 3. Build for Production

```bash
bun run build
# or
npm run build
```

The output distribution files will be generated in `dist/`.

## API Surface (`server.py`)

- `GET /api/candidates`: Merges GeoJSON targets with SQLite reviews
- `GET /api/overlay_info`: Returns LatLngBounds for LRM canopy overlay
- `GET /api/lrm_overlay.png`: Active LRM drape image
- `GET /api/grid`: Returns sector status polygons (`grid.geojson`)
- `GET /api/plss?lat=&lon=`: BLM CadNSDI Section spatial query helper
- `POST /api/verdict`: Save human triage verdicts (`confirmed`, `walkover`, `rejected`)
- `POST /api/export_obsidian`: Generate Markdown notes in Obsidian vault
- `GET /api/export.gpx`: Generate GPX file of confirmed/walkover waypoints

## Architecture & Visual Standards

For complete layout specifications, file format contracts, and visual acceptance rules, refer to `WIRING.md`.
