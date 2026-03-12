"use client";

import { SparklesCore } from "@/components/ui/sparkles";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingShows } from "@/components/dashboard/upcoming-shows";
import { ReachoutPipeline } from "@/components/dashboard/reachout-pipeline";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-linear-to-br from-violet-950/40 via-background to-indigo-950/30">
        <div className="absolute inset-0 opacity-60">
          <SparklesCore
            id="dashboard-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={60}
            className="h-full w-full"
            particleColor="#8B5CF6"
            speed={0.6}
          />
        </div>
        <div className="relative z-10 px-8 py-12">
          <h1 className="text-3xl font-bold tracking-tight">Tour Planner</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your shows at a glance</p>
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingShows />
        <ReachoutPipeline />
      </div>
    </div>
  );
}
