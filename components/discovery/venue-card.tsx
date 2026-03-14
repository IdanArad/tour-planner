"use client";

import { useState } from "react";
import { MapPin, Users, Mail, Globe, ExternalLink, Plus, Check, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { importVenue } from "@/lib/actions/discovery";
import { ReachoutForm } from "@/components/reachouts/reachout-form";

interface VenueCardProps {
  venue: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    capacity: number | null;
    venue_type: string | null;
    booking_email: string | null;
    website_url: string | null;
    genres: string[] | null;
    source: string;
  };
  orgId: string;
}

const typeLabels: Record<string, string> = {
  club: "Club",
  bar: "Bar",
  theater: "Theater",
  arena: "Arena",
  outdoor: "Outdoor",
  festival_grounds: "Festival",
  booking_agency: "Agency",
  promoter: "Promoter",
  event_planner: "Planner",
};

export function VenueCard({ venue, orgId }: VenueCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "imported" | "error">("idle");
  const [importedVenueId, setImportedVenueId] = useState<string | null>(null);
  const [showReachoutForm, setShowReachoutForm] = useState(false);

  async function handleImport() {
    setStatus("loading");
    const result = await importVenue(venue.id, orgId);
    if (result.error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("imported");
      setImportedVenueId(result.venueId);
    }
  }

  return (
    <>
      <div className="group flex flex-col rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium">{venue.name}</h3>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {[venue.city, venue.country].filter(Boolean).join(", ") || "Unknown"}
              </span>
            </div>
          </div>
          {venue.venue_type && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {typeLabels[venue.venue_type] ?? venue.venue_type}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {venue.capacity && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {venue.capacity.toLocaleString()}
            </span>
          )}
          {venue.booking_email && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Mail className="h-4 w-4" />
              Email
            </span>
          )}
          {venue.website_url && (
            <a
              href={venue.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-violet-400 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {venue.genres && venue.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {venue.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2 pt-1">
          {status === "imported" && importedVenueId && (
            <button
              onClick={() => setShowReachoutForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200"
            >
              <Send className="h-3.5 w-3.5" />
              Start Reachout
            </button>
          )}
          <button
            onClick={handleImport}
            disabled={status === "loading" || status === "imported"}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              status === "imported"
                ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                : status === "error"
                  ? "bg-red-500/15 text-red-400"
                  : status === "loading"
                    ? "bg-violet-500/10 text-violet-300 cursor-wait"
                    : "bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200"
            }`}
          >
            {status === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {status === "imported" && <Check className="h-3.5 w-3.5" />}
            {status === "error" && <Plus className="h-3.5 w-3.5" />}
            {status === "idle" && <Plus className="h-3.5 w-3.5" />}
            {status === "idle" && "Import"}
            {status === "loading" && "Importing..."}
            {status === "imported" && "Imported"}
            {status === "error" && "Failed"}
          </button>
        </div>
      </div>

      {showReachoutForm && importedVenueId && (
        <ReachoutForm
          open={true}
          onClose={() => setShowReachoutForm(false)}
          prefilledVenueId={importedVenueId}
        />
      )}
    </>
  );
}
