import { getDiscoveredVenues } from "@/lib/queries/discovery";
import { VenueCard } from "@/components/discovery/venue-card";
import { Pagination } from "@/components/discovery/pagination";
import { MapPin } from "lucide-react";

export async function VenueResults({
  search,
  country,
  venueType,
  hasEmail,
  page,
  orgId,
}: {
  search?: string;
  country?: string;
  venueType?: string;
  hasEmail?: boolean;
  page: number;
  orgId: string;
}) {
  const { venues, count } = await getDiscoveredVenues({
    search,
    country,
    venueType,
    hasEmail,
    page,
    pageSize: 30,
  });

  if (venues.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/30 p-12 text-center">
        <MapPin className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">No venues found</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Try adjusting your filters or run the data import
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(count / 30);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} orgId={orgId} />
        ))}
      </div>
      {totalPages > 1 && <Pagination current={page} total={totalPages} tab="venues" />}
    </>
  );
}
