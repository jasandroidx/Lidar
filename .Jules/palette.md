## 2025-05-18 - Accessibility on Glassmorphic Map HUDs & Modals
**Learning:** Floating translucent map HUD controls (like GPS toggles, zoom buttons, and range sliders) often lack accessible labels and focus indicators, making keyboard navigation and screen reader use difficult. Range inputs require explicit ARIA value properties (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).
**Action:** Always include `aria-label`, value bounds on custom range inputs, and `focus-visible:ring-2` outline rings on translucent HUD buttons and modal dialog elements.
