## 2025-05-20 - High-Frequency GPS Updates Mutating Persistent State

**Learning:** Mutating a persistent React array state (`targets`) on every high-frequency event (like GPS position tracking ticks at 1-2Hz) causes severe main thread blocking (~30-50ms stalls). The state mutation triggers downstream effects including `JSON.stringify` serialization to `localStorage` and Leaflet layer teardown/re-creation on every tick.
**Action:** Derive dynamic properties (like relative distance and bearing) using `useMemo` based on `userGps` rather than mutating the persistent `targets` state array.

## 2025-05-24 - Leaflet Marker In-Place Updates vs Layer Teardown

**Learning:** Re-creating `L.CircleMarker` instances in Leaflet React components on every tick/prop update causes heavy layer teardowns (`markersGroup.clearLayers()`), DOM thrashing, and event listener re-binding. Maintaining a `useRef` map of target IDs to `L.CircleMarker` instances allows in-place updates via `setLatLng()` and `setStyle()`, avoiding layer destruction and reducing update cost from ~30ms to <1ms per tick.
**Action:** Use `useRef` instance maps for Leaflet markers and update position/styles in-place instead of clearing and re-adding markers on every render.
