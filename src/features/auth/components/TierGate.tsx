import { Lock } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";

export type BlurIntensity = "sm" | "md" | "lg";

const BLUR_CLASSES: Record<BlurIntensity, string> = {
  sm: "blur-sm",
  md: "blur-md",
  lg: "blur-lg",
};

export interface TierGateProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  blurIntensity?: BlurIntensity;
}

export function TierGate({
  children,
  fallbackTitle = "Pro Quant Metric",
  fallbackDescription = "Upgrade to Pro to unlock advanced quantitative analysis.",
  blurIntensity = "sm",
}: TierGateProps) {
  const { isPro, openAuthModal } = useAuth();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred gated content */}
      <div className={BLUR_CLASSES[blurIntensity] + " pointer-events-none select-none opacity-30"}>
        {children}
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mx-4 w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-950/95 p-5 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-700/50 bg-amber-950/40">
            <Lock size={16} className="text-amber-400" />
          </div>
          <h3 className="mb-1 font-mono text-sm font-semibold text-zinc-100">
            {fallbackTitle}
          </h3>
          <p className="mb-4 text-xs font-mono text-zinc-400">
            {fallbackDescription}
          </p>
          <button
            onClick={openAuthModal}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-mono font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Lock size={12} />
            Unlock Pro Access
          </button>
        </div>
      </div>
    </div>
  );
}
