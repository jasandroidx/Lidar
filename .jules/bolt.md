## 2025-05-18 - Decoupling Ephemeral GPS Distance Calculations from Persistent React State

**Learning:** Mutating the main `targets` array in React state on every live GPS tick (~1Hz) to recalculate Haversine distance/bearing caused continuous component re-renders, Leaflet layer reconstructions, and localStorage serializations.
**Action:** Keep core entity state immutable for spatial data. Compute distance and bearing dynamically in memoized view projections (`useMemo`) or on-demand when rendering target UI cards and Leaflet markers.
