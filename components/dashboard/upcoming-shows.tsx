"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { ShowStatusBadge } from "@/components/shows/show-status-badge";
import { useStore, getUpcomingShows, getVenueById } from "@/lib/store";
import type { ShowStatus } from "@/types";

export function UpcomingShows() {
  const { state, dispatch } = useStore();
  const upcoming = getUpcomingShows(state).slice(0, 5);

  function handleStatusChange(showId: string, status: ShowStatus) {
    dispatch({ type: "UPDATE_SHOW_STATUS", payload: { id: showId, status } });
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-semibold">Upcoming Shows</h3>
      </div>
      <div className="p-5">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <CalendarPlus className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No upcoming shows</p>
            <Link
              href="/shows"
              className="mt-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              New Show
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((show) => {
              const venue = getVenueById(state, show.venueId);
              return (
                <div key={show.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{venue?.name ?? "Unknown Venue"}</p>
                    <p className="text-xs text-muted-foreground">
                      {venue?.city}{venue?.state ? `, ${venue.state}` : ""} &middot;{" "}
                      {new Date(show.date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ShowStatusBadge status={show.status} onStatusChange={(s) => handleStatusChange(show.id, s)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
