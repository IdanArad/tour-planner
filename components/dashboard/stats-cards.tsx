"use client";

import { Calendar, CheckCircle, Mail, TrendingUp } from "lucide-react";
import { useStore, getUpcomingShows, getReachoutStats } from "@/lib/store";

const iconColors = [
  "text-violet-400",
  "text-emerald-400",
  "text-sky-400",
  "text-amber-400",
];

export function StatsCards() {
  const { state } = useStore();
  const upcoming = getUpcomingShows(state);
  const confirmed = upcoming.filter((s) => s.status === "confirmed" || s.status === "advanced");
  const reachoutStats = getReachoutStats(state);

  const stats = [
    { label: "Upcoming Shows", value: upcoming.length, icon: Calendar },
    { label: "Confirmed", value: confirmed.length, icon: CheckCircle },
    { label: "Pending Reachouts", value: reachoutStats.sent + reachoutStats.needsFollowUp, icon: Mail },
    { label: "Response Rate", value: `${reachoutStats.responseRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }, i) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/80"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <Icon className={`h-4 w-4 ${iconColors[i]}`} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
        </div>
      ))}
    </div>
  );
}
