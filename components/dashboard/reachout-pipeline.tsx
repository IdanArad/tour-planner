"use client";

import { useStore, getReachoutStats } from "@/lib/store";

const segments = [
  { key: "sent", label: "Awaiting", color: "bg-sky-500", barColor: "bg-sky-500/20" },
  { key: "needsFollowUp", label: "Follow Up", color: "bg-amber-500", barColor: "bg-amber-500/20" },
  { key: "replied", label: "Replied", color: "bg-emerald-500", barColor: "bg-emerald-500/20" },
  { key: "noResponse", label: "No Response", color: "bg-zinc-400", barColor: "bg-zinc-400/20" },
] as const;

export function ReachoutPipeline() {
  const { state } = useStore();
  const stats = getReachoutStats(state);
  const maxVal = Math.max(...segments.map(({ key }) => stats[key]), 1);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-semibold">Reachout Pipeline</h3>
      </div>
      <div className="space-y-4 p-5">
        {segments.map(({ key, label, color, barColor }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <span className="text-sm font-semibold">{stats[key]}</span>
            </div>
            <div className={`h-1.5 w-full overflow-hidden rounded-full ${barColor}`}>
              <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${(stats[key] / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
