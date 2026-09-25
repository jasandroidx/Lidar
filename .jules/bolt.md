## 2025-05-20 - High-Frequency GPS Updates Mutating Persistent State

**Learning:** Mutating a persistent React array state (`targets`) on every high-frequency event (like GPS position tracking ticks at 1-2Hz) causes severe main thread blocking (~30-50ms stalls). The state mutation triggers downstream effects including `JSON.stringify` serialization to `localStorage` and Leaflet layer teardown/re-creation on every tick.
**Action:** Derive dynamic properties (like relative distance and bearing) using `useMemo` based on `userGps` rather than mutating the persistent `targets` state array.

## 2025-05-21 - In-place Leaflet Layer Attribute Updates vs Full Layer Teardown

**Learning:** Re-creating Leaflet layers (`clearLayers()` + instantiation) on target selection changes or position ticks destroys DOM elements, event listeners, and tooltips, causing layout reflows and stutter during map navigation.
**Action:** Store Leaflet layer references in a `React.useRef` map keyed by entity ID. Update visual properties in-place using `setStyle()` and `setRadius()` to keep layer management O(1) per updated target.
