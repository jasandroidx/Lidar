## 2025-05-18 - Dynamic Accessible Floating Map HUD Controls
**Learning:** Floating overlay controls over dark canvas/map components often lack visual focus indicators and accessible state reporting. Standard `ring-2 ring-cyan-400` focus states provide high contrast visibility over imagery basemaps, and dynamic `aria-label` strings (reflecting toggle state) are necessary for screen readers on icon-only HUD controls.
**Action:** Always check canvas/map floating control groups for dynamic `aria-label` state updates and visible `focus-visible` rings.

## 2025-05-24 - Dossier Modal Tab ARIA Roles & Keyboard Focus Rings
**Learning:** Tabbed modal dialogs require explicit `role="tablist"` on container divs and `role="tab"` with `aria-selected={isActive}` on individual tab buttons for screen reader navigation, combined with `focus-visible:ring-2 focus-visible:ring-emerald-400` focus rings for keyboard visibility against dark modal backgrounds.
**Action:** Always verify modal tabs have proper ARIA tab roles, active state indicators, and high-contrast `focus-visible` outline rings.
