"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function importVenueToOrg(data: {
  org_id: string;
  discovered_venue_id: string;
  name: string;
  city: string;
  state?: string | null;
  country?: string;
  capacity?: number | null;
}) {
  const supabase = await createClient();

  // Create a venue in the org's venues table
  const { data: venue, error } = await supabase
    .from("venues")
    .insert({
      org_id: data.org_id,
      name: data.name,
      city: data.city,
      state: data.state ?? null,
      country: data.country ?? "US",
      capacity: data.capacity ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message, venue: null };

  // If the discovered venue has a booking email, create a contact
  const { data: discoveredVenue } = await supabase
    .from("discovered_venues")
    .select("booking_email, booking_contact")
    .eq("id", data.discovered_venue_id)
    .single();

  if (discoveredVenue?.booking_email) {
    await supabase.from("contacts").insert({
      org_id: data.org_id,
      venue_id: venue.id,
      name: discoveredVenue.booking_contact ?? "Booking Contact",
      email: discoveredVenue.booking_email,
      role: "Booking",
    });
  }

  revalidatePath("/venues");
  revalidatePath("/discover");
  return { error: null, venue };
}

// importVenue: reads a discovered_venue by ID, copies it into the org's venues table
export async function importVenue(
  discoveredVenueId: string,
  orgId: string
): Promise<{ error: string | null; venueId: string | null }> {
  const supabase = await createClient();

  // Read the discovered venue
  const { data: discovered, error: fetchError } = await supabase
    .from("discovered_venues")
    .select("*")
    .eq("id", discoveredVenueId)
    .single();

  if (fetchError || !discovered) {
    return { error: fetchError?.message ?? "Venue not found", venueId: null };
  }

  // Insert into the org's venues table
  const { data: venue, error: insertError } = await supabase
    .from("venues")
    .insert({
      org_id: orgId,
      name: discovered.name,
      city: discovered.city ?? "Unknown",
      country: discovered.country ?? "Unknown",
      capacity: discovered.capacity ?? null,
      notes: `Imported from discovery database (source: ${discovered.source ?? "unknown"})`,
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message, venueId: null };
  }

  // If the discovered venue has a booking email, create a contact
  if (discovered.booking_email) {
    await supabase.from("contacts").insert({
      org_id: orgId,
      venue_id: venue.id,
      name: discovered.booking_contact ?? "Booking Contact",
      email: discovered.booking_email,
      role: "Booking",
    });
  }

  revalidatePath("/venues");
  revalidatePath("/discover");
  return { error: null, venueId: venue.id };
}

// dismissVenue: marks a discovered venue as dismissed for this org
// For now returns success — we can add a dismissed_venues table later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function dismissVenue(discoveredVenueId: string, orgId: string): Promise<{ error: string | null }> {
  // TODO: add dismissed_venues table for persistent dismissals
  return { error: null };
}

export async function dismissMatch(matchId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunity_matches")
    .update({ status: "dismissed", updated_at: new Date().toISOString() })
    .eq("id", matchId);

  if (error) return { error: error.message };
  revalidatePath("/discover");
  return { error: null };
}

export async function markMatchInterested(matchId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunity_matches")
    .update({ status: "interested", updated_at: new Date().toISOString() })
    .eq("id", matchId);

  if (error) return { error: error.message };
  revalidatePath("/discover");
  return { error: null };
}
