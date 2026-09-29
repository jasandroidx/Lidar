## 2025-05-20 - High-Frequency GPS Updates Mutating Persistent State

**Learning:** Mutating a persistent React array state (`targets`) on every high-frequency event (like GPS position tracking ticks at 1-2Hz) causes severe main thread blocking (~30-50ms stalls). The state mutation triggers downstream effects including `JSON.stringify` serialization to `localStorage` and Leaflet layer teardown/re-creation on every tick.
**Action:** Derive dynamic properties (like relative distance and bearing) using `useMemo` based on `userGps` rather than mutating the persistent `targets` state array.

## 2025-05-22 - Primitive ID Effect Dependencies for Leaflet Map Layers

**Learning:** Passing object references created during render (such as `selectedTargetWithDistance`) to Leaflet map layer `useEffect` dependency arrays forces full teardown and re-creation of all Leaflet map markers on every high-frequency frame (e.g. 1-2Hz GPS updates).
**Action:** Use primitive IDs (`selectedTarget?.id`) in effect dependency arrays to isolate map layer redraws to actual target changes, and always invoke `layerGroup.clearLayers()` before rebuilding map markers.
