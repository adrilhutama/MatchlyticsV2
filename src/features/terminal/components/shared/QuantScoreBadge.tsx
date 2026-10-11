import React from "react";

export interface QuantScoreBadgeProps {
  homeLambda: number;
  awayLambda: number;
  status: "scheduled" | "live" | "finished";
}

export const QuantScoreBadge = React.memo(function QuantScoreBadge({
  homeLambda,
  awayLambda,
  status,
}: QuantScoreBadgeProps) {
  const statusColor =
    status === "live"
      ? "text-rose-400"
      : status === "finished"
        ? "text-zinc-500"
        : "text-emerald-400";

  const statusLabel =
    status === "live" ? "LIVE" : status === "finished" ? "FT" : "SCH";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono font-semibold ${statusColor}`}>
        {statusLabel}
      </span>
      <span className="text-xs font-mono text-zinc-500">
        λ {homeLambda.toFixed(2)} – {awayLambda.toFixed(2)}
      </span>
    </div>
  );
});
