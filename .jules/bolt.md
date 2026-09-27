## 2025-05-20 - High-Frequency GPS Updates Mutating Persistent State

**Learning:** Mutating a persistent React array state (`targets`) on every high-frequency event (like GPS position tracking ticks at 1-2Hz) causes severe main thread blocking (~30-50ms stalls). The state mutation triggers downstream effects including `JSON.stringify` serialization to `localStorage` and Leaflet layer teardown/re-creation on every tick.
**Action:** Derive dynamic properties (like relative distance and bearing) using `useMemo` based on `userGps` rather than mutating the persistent `targets` state array.

## 2025-05-21 - Decoupling Leaflet Layer Effects from Dynamic GPS Prop References

**Learning:** Even when derived state objects (e.g. `selectedTargetWithDistance`) are memoized, passing them as props to map components can trigger full Leaflet layer teardowns and marker re-creations on every high-frequency GPS update tick (1-2Hz) if `useEffect` hooks depend on the object reference rather than primitive IDs (`selectedTarget?.id`).
**Action:** Use primitive fields (`selectedTarget?.id`) in Leaflet layer effect dependency arrays, and decouple unrelated layer updates (like cluster hulls) into separate `useEffect` hooks.
