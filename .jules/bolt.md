# Bolt's Journal

## 2025-05-18 - Avoid Mutating Persistent Targets State on High-Frequency GPS Ticks
**Learning:** Storing transient GPS-derived calculations (distance, bearing) in persistent React state (`targets`) causes every GPS location update (e.g., every 1-2s) to re-render the entire app, trigger heavy synchronous `localStorage.setItem` JSON serialization, and destroy/recreate all Leaflet map circle markers and convex hull layers.
**Action:** Compute derived spatial metrics using `useMemo` on-the-fly from `userGps` and stable `targets` state. Keep `targets` state pure so Leaflet markers and `localStorage` writes only trigger on actual target status mutations.
