# Palette's Journal

## 2025-05-18 - HUD Overlay Controls & Floating Map Sliders Accessibility
**Learning:** Floating HUD map controls and layered translucent overlays in radar/map apps frequently lack visible focus outlines against high-contrast satellite basemaps, and range sliders missing `htmlFor` / `aria-valuenow` prevent screen readers from announcing continuous values correctly.
**Action:** Always add `focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none` and appropriate `aria-*` state/value attributes on all custom map HUD controls and sliders.
