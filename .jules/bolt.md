## 2025-05-20 - Memoizing GPS Distance Calculations vs State Mutation

**Learning:** Mutating a state array (`setTargets`) on frequent events (like 2-second GPS ticks or location watch updates) triggers unnecessary component re-renders and forces costly side-effects (e.g., serializing transient fields like `distanceMeters` into `localStorage`).

**Action:** Compute live spatial calculations dynamically using `useMemo` from state and GPS coordinates rather than dispatching state updates.
