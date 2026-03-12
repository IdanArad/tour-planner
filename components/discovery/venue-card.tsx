"use client";

import { MapPin, Users, Mail, Globe, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export function VenueCard({ venue }: VenueCardProps) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-sm">{venue.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {[venue.city, venue.country].filter(Boolean).join(", ") || "Unknown"}
            </span>
          </div>
        </div>
        {venue.venue_type && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {typeLabels[venue.venue_type] ?? venue.venue_type}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {venue.capacity && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {venue.capacity.toLocaleString()}
          </span>
        )}
        {venue.booking_email && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Mail className="h-3 w-3" />
            Email
          </span>
        )}
        {venue.website_url && (
          <a
            href={venue.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-violet-400 transition-colors"
          >
            <Globe className="h-3 w-3" />
            Website
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {venue.genres && venue.genres.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {venue.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
            >
              {genre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
