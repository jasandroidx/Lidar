## 2025-05-18 - Dynamic Accessible Floating Map HUD Controls
**Learning:** Floating overlay controls over dark canvas/map components often lack visual focus indicators and accessible state reporting. Standard `ring-2 ring-cyan-400` focus states provide high contrast visibility over imagery basemaps, and dynamic `aria-label` strings (reflecting toggle state) are necessary for screen readers on icon-only HUD controls.
**Action:** Always check canvas/map floating control groups for dynamic `aria-label` state updates and visible `focus-visible` rings.

## 2025-05-19 - Accessible Tab Panels & Form Inputs in Dark Floating Popups
**Learning:** Modal detail popups using tab switcher controls require explicit `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"` attributes, along with high-contrast `focus-visible:ring-2` focus rings for keyboard navigation over dark glassmorphic overlays. Floating sidebar search and select inputs should always have descriptive `aria-label` attributes to ensure screen readers provide context.
**Action:** Always add ARIA tab roles/relationships and visible `focus-visible:ring-2` focus indicators to custom tabbed modals and inputs.
