## 2025-05-18 - Dynamic Accessible Floating Map HUD Controls
**Learning:** Floating overlay controls over dark canvas/map components often lack visual focus indicators and accessible state reporting. Standard `ring-2 ring-cyan-400` focus states provide high contrast visibility over imagery basemaps, and dynamic `aria-label` strings (reflecting toggle state) are necessary for screen readers on icon-only HUD controls.
**Action:** Always check canvas/map floating control groups for dynamic `aria-label` state updates and visible `focus-visible` rings.
