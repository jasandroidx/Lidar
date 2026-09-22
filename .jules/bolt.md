## 2025-05-20 - High-Frequency GPS Updates Mutating Persistent State

**Learning:** Mutating a persistent React array state (`targets`) on every high-frequency event (like GPS position tracking ticks at 1-2Hz) causes severe main thread blocking (~30-50ms stalls). The state mutation triggers downstream effects including `JSON.stringify` serialization to `localStorage` and Leaflet layer teardown/re-creation on every tick.
**Action:** Derive dynamic properties (like relative distance and bearing) using `useMemo` based on `userGps` rather than mutating the persistent `targets` state array.

## 2025-05-20 - In-Place Leaflet Marker Style Updates vs ClearLayers Teardown

**Learning:** Recreating Leaflet `L.circleMarker` instances and tooltips on every GPS update tick via `clearLayers()` causes significant DOM element churning and garbage collection spikes. Maintaining a `Map<string, L.CircleMarker>` ref and updating marker styles in-place (`setStyle()`, `setRadius()`) eliminates frame drops during real-time GPS tracking.
**Action:** Use persistent marker references keyed by target ID in Leaflet integration components to update marker properties in-place rather than clearing and recreating map layers on every position tick.
