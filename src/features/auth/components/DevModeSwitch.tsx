import { useDevTierStore } from "@features/auth/stores/useDevTierStore";

/**
 * Floating dev-mode tier switcher.
 * Renders only when isDevModeEnabled is true.
 * Clicking toggles between free and pro tiers.
 */
export function DevModeSwitch() {
  const isDevModeEnabled = useDevTierStore((s) => s.isDevModeEnabled);
  const simulatedTier = useDevTierStore((s) => s.simulatedTier);
  const toggleTier = useDevTierStore((s) => s.toggleTier);

  if (!isDevModeEnabled) return null;

  return (
    <button
      onClick={toggleTier}
      title={`Dev tier: ${simulatedTier.toUpperCase()}. Click to toggle.`}
      aria-label={`Toggle dev tier between free and pro. Currently: ${simulatedTier}`}
      className="fixed bottom-4 right-4 z-50 rounded-full border border-emerald-700/60 bg-zinc-950/90 px-3 py-1.5 text-xs font-mono font-medium text-emerald-400 shadow-lg backdrop-blur-sm transition-all hover:bg-zinc-900 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      [DEV: {simulatedTier.toUpperCase()}]
    </button>
  );
}
