"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";

interface DiscoveryFiltersProps {
  countries: string[];
}

export function DiscoveryFilters({ countries }: DiscoveryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset pagination on filter change
      router.push(`/discover?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilter("search", search || null);
    },
    [search, updateFilter]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    router.push("/discover");
  }, [router]);

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("country") ||
    searchParams.has("type") ||
    searchParams.has("hasEmail");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search venues and festivals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border/50 bg-card/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </form>

      <select
        value={searchParams.get("country") ?? ""}
        onChange={(e) => updateFilter("country", e.target.value || null)}
        className="h-9 rounded-lg border border-border/50 bg-card/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
      >
        <option value="">All Countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("type") ?? ""}
        onChange={(e) => updateFilter("type", e.target.value || null)}
        className="h-9 rounded-lg border border-border/50 bg-card/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
      >
        <option value="">All Types</option>
        <option value="club">Clubs</option>
        <option value="bar">Bars</option>
        <option value="theater">Theaters</option>
        <option value="festival_grounds">Festival Grounds</option>
        <option value="booking_agency">Booking Agencies</option>
        <option value="promoter">Promoters</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={searchParams.get("hasEmail") === "true"}
          onChange={(e) =>
            updateFilter("hasEmail", e.target.checked ? "true" : null)
          }
          className="rounded border-border"
        />
        Has email
      </label>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
