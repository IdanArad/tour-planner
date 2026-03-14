"use client";

import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReachoutStatusBadge } from "@/components/reachouts/reachout-status-badge";
import { PitchGenerator } from "@/components/reachouts/pitch-generator";
import { ReachoutForm } from "@/components/reachouts/reachout-form";
import { useStore, getVenueById, getContactById } from "@/lib/store";
import type { Reachout, ReachoutStatus } from "@/types";

function formatDate(iso?: string) {
  if (!iso) return "\u2014";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ReachoutsTable({ reachouts }: { reachouts: Reachout[] }) {
  const { state, dispatch } = useStore();
  const [editReachout, setEditReachout] = useState<Reachout | null>(null);
  const [pitchTarget, setPitchTarget] = useState<{
    reachoutId: string;
    venueName: string;
    venueCity?: string;
    venueCountry?: string;
  } | null>(null);

  function handleStatusChange(reachoutId: string, status: ReachoutStatus) {
    dispatch({ type: "UPDATE_REACHOUT_STATUS", payload: { id: reachoutId, status } });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Follow-Up</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reachouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No reachouts found
                </TableCell>
              </TableRow>
            ) : (
              reachouts.map((r) => {
                const venue = getVenueById(state, r.venueId);
                const contact = r.contactId ? getContactById(state, r.contactId) : undefined;
                return (
                  <TableRow key={r.id} className="border-border/50 transition-colors hover:bg-accent/30">
                    <TableCell className="font-medium">{venue?.name ?? "\u2014"}</TableCell>
                    <TableCell>{contact?.name ?? "\u2014"}</TableCell>
                    <TableCell className="capitalize">{r.method ?? "\u2014"}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.sentAt)}</TableCell>
                    <TableCell>
                      <ReachoutStatusBadge status={r.status} onStatusChange={(s) => handleStatusChange(r.id, s)} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.lastFollowUp)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setPitchTarget({
                              reachoutId: r.id,
                              venueName: venue?.name ?? "Unknown Venue",
                              venueCity: venue?.city,
                              venueCountry: venue?.country,
                            })
                          }
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/10"
                          title="Generate AI pitch email"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Pitch
                        </button>
                        <button
                          onClick={() => setEditReachout(r)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          title="Edit reachout"
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

      {pitchTarget && (
        <PitchGenerator
          reachoutId={pitchTarget.reachoutId}
          venueName={pitchTarget.venueName}
          venueCity={pitchTarget.venueCity}
          venueCountry={pitchTarget.venueCountry}
          artistName={state.artist.name}
          artistGenre={state.artist.genre}
          onClose={() => setPitchTarget(null)}
        />
      )}

      {editReachout && (
        <ReachoutForm open={true} onClose={() => setEditReachout(null)} reachout={editReachout} />
      )}
    </>
  );
}
