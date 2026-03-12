"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReachoutStatusBadge } from "@/components/reachouts/reachout-status-badge";
import { useStore, getVenueById, getContactById } from "@/lib/store";
import type { Reachout, ReachoutStatus } from "@/types";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ReachoutsTable({ reachouts }: { reachouts: Reachout[] }) {
  const { state, dispatch } = useStore();

  function handleStatusChange(reachoutId: string, status: ReachoutStatus) {
    dispatch({ type: "UPDATE_REACHOUT_STATUS", payload: { id: reachoutId, status } });
  }

  return (
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
            <TableHead>Notes</TableHead>
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
                  <TableCell className="font-medium">{venue?.name ?? "—"}</TableCell>
                  <TableCell>{contact?.name ?? "—"}</TableCell>
                  <TableCell className="capitalize">{r.method ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(r.sentAt)}</TableCell>
                  <TableCell>
                    <ReachoutStatusBadge status={r.status} onStatusChange={(s) => handleStatusChange(r.id, s)} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(r.lastFollowUp)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {r.notes ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
