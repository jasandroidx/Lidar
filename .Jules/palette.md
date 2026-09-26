## 2025-05-18 - Dynamic Accessible Floating Map HUD Controls
**Learning:** Floating overlay controls over dark canvas/map components often lack visual focus indicators and accessible state reporting. Standard `ring-2 ring-cyan-400` focus states provide high contrast visibility over imagery basemaps, and dynamic `aria-label` strings (reflecting toggle state) are necessary for screen readers on icon-only HUD controls.
**Action:** Always check canvas/map floating control groups for dynamic `aria-label` state updates and visible `focus-visible` rings.

## 2025-05-19 - Accessible Modal Dialogs and Escape Key Dismissal
**Learning:** Full-screen modal overlays (like detail dossiers) need `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and an active `keydown` listener for the `Escape` key. Without `Escape` key dismissal and tab-list ARIA roles, keyboard and screen reader users cannot easily navigate or dismiss modal views.
**Action:** Always include an `Escape` key listener and WAI-ARIA modal dialog attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) when creating or modifying overlay modals.
