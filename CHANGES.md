# Repair pass — 2026-09-14

## Build was broken. Fixed.
The repo did not compile as uploaded. Four pre-existing defects in
`src/components/MapRadarCanvas.tsx`:

1. A `useEffect(() => {` opener was missing entirely — the candidate-marker
   render block started mid-air at a bare `targets.forEach(...)`.
2. The outer wrapper `<div>` in the JSX return was never closed.
3. Two zoom buttons each carried duplicate `onClick` props, the second calling
   `handleZoom()` — a function that does not exist in the file.
4. `getConvexHull()` was called on line 148 but never defined anywhere in the
   codebase. Homestead cluster hulls would have thrown at runtime. Implemented
   as a monotone chain hull.
   Also removed a duplicate `ScanGridTile` import.

`npx tsc --noEmit` and `npx vite build` both pass now.

## Fabricated field data removed
`src/data/historicalData.ts` shipped 12 targets carrying invented observations
presented as real:

- 12 `anomalyDescription` — detector output nobody ran
- 12 `lidarFeatures` — feature lists nobody measured
- 12 `fieldNotes` — first-person site observations nobody made
  ("18 inches of deciduous humus", "sub-surface ground radar anomalies";
  there is no GPR on this project)
- 4 `verificationStatus: 'confirmed'` and 1 `confirmedDate: '1885 Record
  Verified'` — an 1885 book cannot verify a LiDAR anomaly

All removed. Every target is now `unverified` with `citationVerified: false`.
The underlying history (names, dates, Goodspeed citations, chronicle summaries)
is KEPT — it is probably real and is checkable against `goodspeed_fulltext.txt`
on the bot VM. Only the invented sensor claims were cut.

These fields are now optional in `types.ts`. Populate them ONLY from a real
detector run or a real site visit. Absent means nobody has looked yet.

## Site-location safety
- `locationRestricted?: boolean` added to `TerrainTarget`.
- The `prehistoric_mound` target is marked restricted and its coordinates are
  rounded to 2 decimals (~1 km). Burial mounds are protected under IC 14-21-1
  and precise locations do not belong in a public repo.
- `.gitignore` now excludes `*.geojson` (except `grid.geojson`), `chips/`,
  `crops/`, `anomaly_crops/`, `candidates*`, `dossiers/`, `*.img`, `*.las`.
  **Code public, coordinates private.**

## Real coverage grid
`grid.geojson` was a 2-tile placeholder ("Winslow Tile 01", status
`completed`). Replaced with all **448 real Pike County tiles** from the Purdue
index, each carrying ledger fields: `downloaded`, `scanned`, `reviewed`,
`glo_pulled`, `notes`. This doubles as the rolling scoreboard.

Tile IDs are Indiana West State Plane easting/northing in thousands of feet:
`29151140` = E 2,915,000 / N 1,140,000, 5000 ft square, 2.5 ft cells.

## Renamed
`package.json` name: `react-example` → `pike-terrain-radar`.

## Still open
- `lrm_overlay.png` is ONE static PNG pinned to a hardcoded box
  (38.395–38.415, -87.235 to -87.205) — roughly 1 sq mi of 336. The canopy
  peel only works there. Needs per-tile LRM rendered as an XYZ layer.
- All 12 Goodspeed citations need checking against the full text.
- `dev` script binds `0.0.0.0`. Fine behind Tailscale, not on open internet.

---

# Pass 2 — county-wide LRM tiles

## The canopy peel now works everywhere
`L.imageOverlay('/lrm_overlay.png', bounds)` was one PNG stretched over a
hardcoded box — 38.395–38.415 by -87.235 to -87.205. Roughly 1 sq mi of 336.
Outside that rectangle the peel slider did nothing.

Replaced with a real XYZ tile layer: `/lrm_tiles/{z}/{x}/{y}.png`,
`minNativeZoom 14`, `maxNativeZoom 18`, overzoom to 21. Missing tiles are
normal (a transparent 1px `errorTileUrl`) — tiles exist only where a DTM has
been processed, so coverage grows as you scan more.

## New: tools/make_lrm_tiles.py
Builds the pyramid from Purdue DTM `.img` tiles.

    python3 tools/make_lrm_tiles.py --dtm-dir /workspace/dem_tiles \
                                    --out public/lrm_tiles --zooms 14-18

Per source tile: LRM (DTM minus a 22 ft gaussian) blended with a hillshade,
warm on raised ground, cool in hollows, reprojected from Indiana West State
Plane straight into each Web Mercator tile. Overlapping DTMs alpha-composite,
so tiles can be built incrementally in any order.

Verified on 2 real tiles: 535 tiles, ~100 s, 40 MB.
**Budget roughly 20 MB and 50 s per source tile** — the full 448-tile county is
about **9 GB and 6 hours single-threaded**. Parallelise by tile, or drop z18
(that's 68% of the tiles and most of the bytes) if space is tight.

## PWA precache bug — would have bricked the install
`globPatterns: ['**/*.{...png...}']` precached every PNG in `dist/`. With the
LRM pyramid in `public/`, that is ~9 GB pushed into the service worker on
install. Fixed:

- `globPatterns` no longer sweeps all PNGs; `globIgnores: ['**/lrm_tiles/**']`
- `maximumFileSizeToCacheInBytes: 4 MB`
- LRM tiles moved to a `CacheFirst` runtime rule (`lrm-tiles`, 3000 entries)

Side benefit: tiles you actually looked at stay cached for field use with no
signal — which is what you want on a PWA anyway.

Precache is now **16 entries / 558 KiB**.

## Also
- `public/lrm_tiles/` added to `.gitignore` — generated, rebuild from DTMs.
- `lrm_overlay.png` dropped from PWA `includeAssets`. The file and its
  `server.py` endpoints are left in place; delete once you confirm nothing
  else reads them.
