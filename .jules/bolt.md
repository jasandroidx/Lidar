## 2025-05-20 - High-Frequency GPS Updates Mutating Persistent State

**Learning:** Mutating a persistent React array state (`targets`) on every high-frequency event (like GPS position tracking ticks at 1-2Hz) causes severe main thread blocking (~30-50ms stalls). The state mutation triggers downstream effects including `JSON.stringify` serialization to `localStorage` and Leaflet layer teardown/re-creation on every tick.
**Action:** Derive dynamic properties (like relative distance and bearing) using `useMemo` based on `userGps` rather than mutating the persistent `targets` state array.

## 2025-05-21 - Unstable Prop References Triggering Leaflet Layer Teardowns

**Learning:** Passing derived target objects (`selectedTargetWithDistance`) that update on every GPS tick into Leaflet map components causes `useEffect` hooks depending on `selectedTarget` to run at 1-2Hz. This tears down and re-instantiates all Leaflet `L.circleMarker` and `L.polygon` hull layers repeatedly, causing DOM churn and garbage collection pauses during live field walks.
**Action:** Pass the stable `selectedTarget` base object to map components, and extract `selectedTargetId = selectedTarget?.id` for use in `useEffect` dependency arrays so Leaflet markers update only when target selection or status actually changes.
