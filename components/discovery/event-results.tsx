import { getDiscoveredEvents } from "@/lib/queries/discovery";
import { EventCard } from "@/components/discovery/event-card";
import { Pagination } from "@/components/discovery/pagination";
import { Calendar } from "lucide-react";

export async function EventResults({
  search,
  country,
  page,
}: {
  search?: string;
  country?: string;
  page: number;
}) {
  const { events, count } = await getDiscoveredEvents({
    search,
    country,
    page,
    pageSize: 30,
  });

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/30 p-12 text-center">
        <Calendar className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">No festivals found</p>
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
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} tab="festivals" />
      )}
    </>
  );
}
