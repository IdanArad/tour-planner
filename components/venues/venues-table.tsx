"use client";

import { useState } from "react";
import { Pencil, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VenueForm } from "@/components/venues/venue-form";
import { ContactForm } from "@/components/contacts/contact-form";
import { useStore } from "@/lib/store";
import type { Venue } from "@/types";

export function VenuesTable() {
  const { state } = useStore();
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [contactVenueId, setContactVenueId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Shows</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.venues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No venues found
                </TableCell>
              </TableRow>
            ) : (
              state.venues.map((venue) => {
                const showCount = state.shows.filter((s) => s.venueId === venue.id).length;
                return (
                  <TableRow key={venue.id} className="border-border/50 transition-colors hover:bg-accent/30">
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell>
                      {venue.city}
                      {venue.state ? `, ${venue.state}` : ""}
                    </TableCell>
                    <TableCell>{venue.capacity?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell>{venue.contacts.length}</TableCell>
                    <TableCell>{showCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setContactVenueId(venue.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          title="Add contact"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditVenue(venue)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          title="Edit venue"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editVenue && (
        <VenueForm open={true} onClose={() => setEditVenue(null)} venue={editVenue} />
      )}

      {contactVenueId && (
        <ContactForm open={true} onClose={() => setContactVenueId(null)} venueId={contactVenueId} />
      )}
    </>
  );
}
