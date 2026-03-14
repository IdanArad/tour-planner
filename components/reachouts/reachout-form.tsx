"use client";

import { useState, useMemo } from "react";
import { Dialog } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { addReachout, updateReachout, deleteReachout } from "@/lib/actions/reachouts";
import type { Reachout, ReachoutMethod } from "@/types";

const methods: { value: ReachoutMethod; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "dm", label: "DM" },
  { value: "in_person", label: "In Person" },
];

interface ReachoutFormProps {
  open: boolean;
  onClose: () => void;
  reachout?: Reachout;
  prefilledVenueId?: string;
}

export function ReachoutForm({ open, onClose, reachout, prefilledVenueId }: ReachoutFormProps) {
  const { state, dispatch } = useStore();
  const isEdit = !!reachout;

  const [venueId, setVenueId] = useState(reachout?.venueId ?? prefilledVenueId ?? "");
  const [contactId, setContactId] = useState(reachout?.contactId ?? "");
  const [method, setMethod] = useState<ReachoutMethod>(reachout?.method ?? "email");
  const [tourId, setTourId] = useState(reachout?.tourId ?? "");
  const [notes, setNotes] = useState(reachout?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const contactsForVenue = useMemo(() => {
    const venue = state.venues.find((v) => v.id === venueId);
    return venue?.contacts ?? [];
  }, [state.venues, venueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.orgId) {
      setError("App data not loaded yet");
      return;
    }
    if (!venueId) {
      setError("Venue is required");
      return;
    }
    setSaving(true);
    setError("");

    if (isEdit) {
      const result = await updateReachout(reachout.id, {
        venue_id: venueId,
        contact_id: contactId || null,
        tour_id: tourId || null,
        method,
        notes: notes || null,
      });
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    } else {
      const result = await addReachout({
        org_id: state.orgId,
        venue_id: venueId,
        contact_id: contactId || null,
        tour_id: tourId || null,
        status: "drafted",
        method,
        notes: notes || null,
      });
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    }

    dispatch({ type: "REFRESH" });
    onClose();
  }

  async function handleDelete() {
    if (!reachout) return;
    setSaving(true);
    const result = await deleteReachout(reachout.id);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    dispatch({ type: "DELETE_REACHOUT", payload: reachout.id });
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Reachout" : "New Reachout"}
      description={isEdit ? "Update reachout details" : "Start a new venue outreach"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Venue *</label>
          <select value={venueId} onChange={(e) => { setVenueId(e.target.value); setContactId(""); }} className={inputClass}>
            <option value="">Select a venue...</option>
            {state.venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.city}, {v.country}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Contact</label>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={inputClass}>
              <option value="">
                {contactsForVenue.length === 0 ? "No contacts" : "Select contact..."}
              </option>
              {contactsForVenue.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.role ? ` (${c.role})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as ReachoutMethod)} className={inputClass}>
              {methods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {state.tours.length > 0 && (
          <div>
            <label className={labelClass}>Tour (optional)</label>
            <select value={tourId} onChange={(e) => setTourId(e.target.value)} className={inputClass}>
              <option value="">No tour</option>
              {state.tours.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any notes about this outreach..."
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              Delete
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm hover:bg-accent/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
