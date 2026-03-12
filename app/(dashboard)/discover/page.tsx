import { Suspense } from "react";
import {
  getDiscoveryStats,
  getDiscoveryCountries,
} from "@/lib/queries/discovery";
import { DiscoveryFilters } from "@/components/discovery/discovery-filters";
import { VenueResults } from "@/components/discovery/venue-results";
import { EventResults } from "@/components/discovery/event-results";
import { MapPin, Calendar, Database } from "lucide-react";

interface DiscoverPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    country?: string;
    type?: string;
    hasEmail?: string;
    page?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const tab = params.tab ?? "venues";
  const page = parseInt(params.page ?? "1", 10);

  const [stats, countries] = await Promise.all([
    getDiscoveryStats(),
    getDiscoveryCountries(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse {stats.totalVenues.toLocaleString()} venues and{" "}
          {stats.totalEvents.toLocaleString()} festivals from our database
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-violet-400" />
            Venues
          </div>
          <p className="mt-1 text-2xl font-bold">{stats.totalVenues.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Festivals
          </div>
          <p className="mt-1 text-2xl font-bold">{stats.totalEvents.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4 text-amber-400" />
            Countries
          </div>
          <p className="mt-1 text-2xl font-bold">{countries.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border/50 bg-card/30 p-1 w-fit">
        <TabLink href={`/discover?tab=venues`} active={tab === "venues"}>
          Venues
        </TabLink>
        <TabLink href={`/discover?tab=festivals`} active={tab === "festivals"}>
          Festivals
        </TabLink>
      </div>

      {/* Filters */}
      <DiscoveryFilters countries={countries} />

      {/* Content */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-border/50 bg-card/30"
              />
            ))}
          </div>
        }
      >
        {tab === "venues" ? (
          <VenueResults
            search={params.search}
            country={params.country}
            venueType={params.type}
            hasEmail={params.hasEmail === "true"}
            page={page}
          />
        ) : (
          <EventResults
            search={params.search}
            country={params.country}
            page={page}
          />
        )}
      </Suspense>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-violet-500/15 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </a>
  );
}
