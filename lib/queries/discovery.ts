import { createClient } from "@/lib/supabase/server";

export interface DiscoveryFilters {
  search?: string;
  country?: string;
  venueType?: string;
  minCapacity?: number;
  maxCapacity?: number;
  hasEmail?: boolean;
  page?: number;
  pageSize?: number;
}

export async function getDiscoveredVenues(filters: DiscoveryFilters = {}) {
  const supabase = await createClient();
  const { page = 1, pageSize = 50 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("discovered_venues")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.country) {
    query = query.eq("country", filters.country);
  }
  if (filters.venueType) {
    query = query.eq("venue_type", filters.venueType);
  }
  if (filters.minCapacity) {
    query = query.gte("capacity", filters.minCapacity);
  }
  if (filters.maxCapacity) {
    query = query.lte("capacity", filters.maxCapacity);
  }
  if (filters.hasEmail) {
    query = query.not("booking_email", "is", null);
  }

  const { data, error, count } = await query;
  if (error) return { venues: [], count: 0, error: error.message };
  return { venues: data ?? [], count: count ?? 0, error: null };
}

export async function getDiscoveredEvents(filters: DiscoveryFilters = {}) {
  const supabase = await createClient();
  const { page = 1, pageSize = 50 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("discovered_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.country) {
    query = query.eq("country", filters.country);
  }

  const { data, error, count } = await query;
  if (error) return { events: [], count: 0, error: error.message };
  return { events: data ?? [], count: count ?? 0, error: null };
}

export async function getDiscoveryStats() {
  const supabase = await createClient();

  const [venueResult, eventResult] = await Promise.all([
    supabase.from("discovered_venues").select("*", { count: "exact", head: true }),
    supabase.from("discovered_events").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalVenues: venueResult.count ?? 0,
    totalEvents: eventResult.count ?? 0,
  };
}

export async function getDiscoveryCountries() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discovered_venues")
    .select("country")
    .not("country", "is", null);

  const countries = new Set<string>();
  data?.forEach((row) => {
    if (row.country) countries.add(row.country);
  });

  return Array.from(countries).sort();
}
