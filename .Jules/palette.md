## 2025-05-18 - Modal Overlay Keyboard Navigation & ARIA Dialog Context
**Learning:** Custom overlay dialogs in dark/tactile HUD maps (like `MarkerDetailPopup`) require explicit `role="dialog"`, `aria-modal="true"`, and keyboard `Escape` key event listeners so screen reader and keyboard users can quickly dismiss overlays without needing to locate icon-only close buttons.
**Action:** Always bind `Escape` key listeners and pass appropriate `aria-labelledby` IDs on custom popup and drawer components across the application.
