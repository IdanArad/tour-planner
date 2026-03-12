"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import React from "react";
import { createClient } from "@/lib/supabase/client";
import { updateShowStatus as updateShowStatusAction } from "@/lib/actions/shows";
import { updateReachoutStatus as updateReachoutStatusAction } from "@/lib/actions/reachouts";
import type {
  AppState,
  Show,
  Reachout,
  Venue,
  Artist,
  Tour,
  Contact,
  ShowStatus,
  ReachoutStatus,
} from "@/types";

// --- Actions (same interface as before) ---

type Action =
  | { type: "ADD_SHOW"; payload: Show }
  | { type: "UPDATE_SHOW_STATUS"; payload: { id: string; status: ShowStatus } }
  | { type: "ADD_REACHOUT"; payload: Reachout }
  | {
      type: "UPDATE_REACHOUT_STATUS";
      payload: { id: string; status: ReachoutStatus };
    };

// --- DB row → app type mappers ---

function mapShow(row: Record<string, unknown>): Show {
  return {
    id: row.id as string,
    tourId: row.tour_id as string | undefined,
    venueId: row.venue_id as string,
    artistId: row.artist_id as string,
    date: row.date as string,
    status: row.status as ShowStatus,
    type: row.type as Show["type"],
    guarantee: row.guarantee != null ? Number(row.guarantee) : undefined,
    ticketPrice:
      row.ticket_price != null ? Number(row.ticket_price) : undefined,
    doorsTime: row.doors_time as string | undefined,
    setTime: row.set_time as string | undefined,
    notes: row.notes as string | undefined,
    reachoutId: row.reachout_id as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    venueId: row.venue_id as string | undefined,
  };
}

function mapVenue(row: Record<string, unknown>): Venue {
  const contacts = Array.isArray(row.contacts)
    ? (row.contacts as Record<string, unknown>[]).map(mapContact)
    : [];
  return {
    id: row.id as string,
    name: row.name as string,
    city: row.city as string,
    state: row.state as string | undefined,
    country: row.country as string,
    capacity: row.capacity as number | undefined,
    contacts,
    notes: row.notes as string | undefined,
  };
}

function mapReachout(row: Record<string, unknown>): Reachout {
  return {
    id: row.id as string,
    venueId: row.venue_id as string,
    contactId: row.contact_id as string | undefined,
    tourId: row.tour_id as string | undefined,
    status: row.status as ReachoutStatus,
    method: row.method as Reachout["method"],
    sentAt: row.sent_at as string | undefined,
    lastFollowUp: row.last_follow_up as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapTour(row: Record<string, unknown>): Tour {
  return {
    id: row.id as string,
    name: row.name as string,
    artistId: row.artist_id as string,
    startDate: row.start_date as string | undefined,
    endDate: row.end_date as string | undefined,
    status: row.status as Tour["status"],
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapArtist(row: Record<string, unknown>): Artist {
  return {
    id: row.id as string,
    name: row.name as string,
    genre: row.genre as string | undefined,
    contactEmail: row.contact_email as string | undefined,
    contactPhone: row.contact_phone as string | undefined,
    notes: row.notes as string | undefined,
  };
}

// --- Context ---

const StoreContext = createContext<{
  state: AppState;
  dispatch: (action: Action) => void;
  loading: boolean;
} | null>(null);

const emptyState: AppState = {
  artist: { id: "", name: "" },
  tours: [],
  shows: [],
  venues: [],
  reachouts: [],
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const supabase = createClient();

    const [artistRes, toursRes, showsRes, venuesRes, reachoutsRes] =
      await Promise.all([
        supabase
          .from("artists")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1),
        supabase
          .from("tours")
          .select("*")
          .order("start_date", { ascending: true }),
        supabase
          .from("shows")
          .select("*")
          .order("date", { ascending: true }),
        supabase
          .from("venues")
          .select("*, contacts(*)")
          .order("name", { ascending: true }),
        supabase
          .from("reachouts")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    setState({
      artist: artistRes.data?.[0]
        ? mapArtist(artistRes.data[0] as Record<string, unknown>)
        : { id: "", name: "No Artist" },
      tours: (toursRes.data ?? []).map((r) =>
        mapTour(r as Record<string, unknown>)
      ),
      shows: (showsRes.data ?? []).map((r) =>
        mapShow(r as Record<string, unknown>)
      ),
      venues: (venuesRes.data ?? []).map((r) =>
        mapVenue(r as Record<string, unknown>)
      ),
      reachouts: (reachoutsRes.data ?? []).map((r) =>
        mapReachout(r as Record<string, unknown>)
      ),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled && data.user) fetchAll();
        else if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const dispatch = useCallback(
    async (action: Action) => {
      switch (action.type) {
        case "UPDATE_SHOW_STATUS": {
          // Optimistic update
          setState((prev) => ({
            ...prev,
            shows: prev.shows.map((s) =>
              s.id === action.payload.id
                ? { ...s, status: action.payload.status }
                : s
            ),
          }));
          const showResult = await updateShowStatusAction(
            action.payload.id,
            action.payload.status
          );
          if (showResult?.error) fetchAll();
          break;
        }
        case "UPDATE_REACHOUT_STATUS": {
          setState((prev) => ({
            ...prev,
            reachouts: prev.reachouts.map((r) =>
              r.id === action.payload.id
                ? { ...r, status: action.payload.status }
                : r
            ),
          }));
          const reachoutResult = await updateReachoutStatusAction(
            action.payload.id,
            action.payload.status
          );
          if (reachoutResult?.error) fetchAll();
          break;
        }
        case "ADD_SHOW":
        case "ADD_REACHOUT":
          fetchAll();
          break;
      }
    },
    [fetchAll]
  );

  return React.createElement(
    StoreContext.Provider,
    { value: { state, dispatch, loading } },
    children
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// --- Selectors (unchanged — pure functions on AppState) ---

export function getUpcomingShows(state: AppState): Show[] {
  const today = new Date().toISOString().split("T")[0];
  return state.shows
    .filter(
      (s) =>
        s.date >= today && s.status !== "cancelled" && s.status !== "played"
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getShowsByTour(state: AppState, tourId: string): Show[] {
  return state.shows
    .filter((s) => s.tourId === tourId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getReachoutsByStatus(
  state: AppState,
  status: ReachoutStatus
): Reachout[] {
  return state.reachouts.filter((r) => r.status === status);
}

export function getVenueById(state: AppState, venueId: string) {
  return state.venues.find((v) => v.id === venueId);
}

export function getContactById(state: AppState, contactId: string) {
  for (const venue of state.venues) {
    const contact = venue.contacts.find((c) => c.id === contactId);
    if (contact) return contact;
  }
  return undefined;
}

export function getReachoutStats(state: AppState) {
  const total = state.reachouts.length;
  const sent = state.reachouts.filter((r) => r.status === "sent").length;
  const replied = state.reachouts.filter(
    (r) => r.status === "replied" || r.status === "booked"
  ).length;
  const needsFollowUp = state.reachouts.filter(
    (r) => r.status === "follow_up"
  ).length;
  const noResponse = state.reachouts.filter(
    (r) => r.status === "no_response"
  ).length;
  const responseRate =
    total > 0
      ? Math.round(
          ((replied +
            state.reachouts.filter((r) => r.status === "declined").length) /
            total) *
            100
        )
      : 0;
  return { total, sent, replied, needsFollowUp, noResponse, responseRate };
}
