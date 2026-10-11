import React from "react";

export interface OddsPillProps {
  label: string;
  price: number;
  ev?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const OddsPill = React.memo(function OddsPill({
  label,
  price,
  ev,
  isSelected,
  onClick,
}: OddsPillProps) {
  const hasEdge = ev !== undefined && ev >= 0.025;

  return (
    <button
      onClick={onClick}
      title={
        ev !== undefined
          ? `Price: ${price.toFixed(2)} | EV: ${((ev ?? 0) * 100).toFixed(1)}%`
          : `Price: ${price.toFixed(2)}`
      }
      className={
        "inline-flex flex-col items-center rounded-md border px-2 py-1.5 text-center transition-all " +
        (isSelected
          ? "border-emerald-500 bg-emerald-950/40"
          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500") +
        (hasEdge ? " ring-1 ring-emerald-500/60" : "")
      }
    >
      <span className="text-xs font-mono text-zinc-400">{label}</span>
      <span className="text-xs font-mono font-semibold text-zinc-100">
        {price.toFixed(2)}
      </span>
      {hasEdge && (
        <span className="mt-0.5 text-xs font-mono text-emerald-400">
          +{(ev! * 100).toFixed(1)}%
        </span>
      )}
    </button>
  );
});
