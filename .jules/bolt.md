# Bolt's Journal - Pike Terrain Radar Performance Learnings

## 2025-05-18 - Avoid mutating global target state on GPS position updates
**Learning:** Updating global state (`targets`) on every GPS tick (1-2s) caused cascading re-renders, full map layer re-creation (clearing and rebuilding all Leaflet markers/polygons), and synchronous `localStorage.setItem` disk I/O.
**Action:** Keep core `targets` state static during navigation and derive dynamic distance/bearing properties on-the-fly with `useMemo` for components that need them.
