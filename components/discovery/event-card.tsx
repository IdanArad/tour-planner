"use client";

import { Calendar, MapPin, Mail, Globe, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    start_date: string | null;
    end_date: string | null;
    event_type: string | null;
    booking_email: string | null;
    website_url: string | null;
    status: string | null;
    genres: string[] | null;
  };
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  past: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function EventCard({ event }: EventCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  return (
    <div className="group rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-sm">{event.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {[event.city, event.country].filter(Boolean).join(", ") || "Unknown"}
            </span>
          </div>
        </div>
        {event.status && (
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${statusColors[event.status] ?? ""}`}
          >
            {event.status}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(event.start_date || event.end_date) && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(event.start_date)}
            {event.end_date && ` — ${formatDate(event.end_date)}`}
          </span>
        )}
        {event.booking_email && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Mail className="h-3 w-3" />
            Email
          </span>
        )}
        {event.website_url && (
          <a
            href={event.website_url}
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

      {event.genres && event.genres.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {event.genres.slice(0, 3).map((genre) => (
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
