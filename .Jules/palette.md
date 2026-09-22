## 2025-05-18 - Dynamic Accessible Floating Map HUD Controls
**Learning:** Floating overlay controls over dark canvas/map components often lack visual focus indicators and accessible state reporting. Standard `ring-2 ring-cyan-400` focus states provide high contrast visibility over imagery basemaps, and dynamic `aria-label` strings (reflecting toggle state) are necessary for screen readers on icon-only HUD controls.
**Action:** Always check canvas/map floating control groups for dynamic `aria-label` state updates and visible `focus-visible` rings.

## 2026-09-22 - Keyboard Modal Escape & Accessible Tablist Dialogs
**Learning:** In single-page map applications with modal overlays (such as historical target dossiers), unmounted modal state hooks (`isPopupOpen`) must conditionally render the modal container so that global `Escape` key handlers and screen reader focus traps are only active when the modal is open. Adding `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `role="tablist"`, and `role="tab"` with `aria-selected` ensures full keyboard and screen-reader accessibility.
**Action:** Always wrap modal dialog components with conditional state rendering (`isOpen && <Modal />`) and include global `Escape` keyboard shortcuts alongside full ARIA dialog/tablist attributes.
