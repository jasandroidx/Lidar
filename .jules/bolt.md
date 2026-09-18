## 2025-05-18 - Avoid mutating state in effects for GPS updates
**Learning:** Mutating core state (`targets`) on high-frequency events like GPS location ticks triggers expensive `localStorage` JSON serialization and forces child components (like Leaflet map canvas) to teardown and re-instantiate DOM/canvas elements on every step.
**Action:** Always derive dynamic runtime values (like distance/bearing relative to live GPS) using `useMemo` so base state stays stable and map components perform O(1) position updates without re-creating map markers or writing to storage.
