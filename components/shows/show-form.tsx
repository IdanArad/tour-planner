"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";
import { addShow } from "@/lib/actions/shows";
import { updateShow } from "@/lib/actions/shows";
import { deleteShow } from "@/lib/actions/shows";
import type { Show, ShowType, ShowStatus } from "@/types";

const showTypes: { value: ShowType; label: string }[] = [
  { value: "headline", label: "Headline" },
  { value: "opener", label: "Opener" },
  { value: "co_headline", label: "Co-Headline" },
  { value: "festival", label: "Festival" },
  { value: "private", label: "Private" },
];

const showStatuses: { value: ShowStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "pitched", label: "Pitched" },
  { value: "hold", label: "Hold" },
  { value: "confirmed", label: "Confirmed" },
  { value: "advanced", label: "Advanced" },
  { value: "played", label: "Played" },
  { value: "cancelled", label: "Cancelled" },
];

interface ShowFormProps {
  open: boolean;
  onClose: () => void;
  show?: Show;
}

export function ShowForm({ open, onClose, show }: ShowFormProps) {
  const { state, dispatch } = useStore();
  const isEdit = !!show;

  const [venueId, setVenueId] = useState(show?.venueId ?? "");
  const [date, setDate] = useState(show?.date ?? "");
  const [type, setType] = useState<ShowType>(show?.type ?? "headline");
  const [status, setStatus] = useState<ShowStatus>(show?.status ?? "idea");
  const [tourId, setTourId] = useState(show?.tourId ?? "");
  const [guarantee, setGuarantee] = useState(show?.guarantee?.toString() ?? "");
  const [notes, setNotes] = useState(show?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.orgId || !state.artist.id) {
      setError("App data not loaded yet");
      return;
    }
    if (!venueId || !date) {
      setError("Venue and date are required");
      return;
    }
    setSaving(true);
    setError("");

    if (isEdit) {
      const result = await updateShow(show.id, {
        venue_id: venueId,
        date,
        type,
        status,
        tour_id: tourId || null,
        guarantee: guarantee ? Number(guarantee) : null,
        notes: notes || null,
      });
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    } else {
      const result = await addShow({
        org_id: state.orgId,
        artist_id: state.artist.id,
        venue_id: venueId,
        date,
        type,
        status,
        tour_id: tourId || null,
        guarantee: guarantee ? Number(guarantee) : null,
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
    if (!show) return;
    setSaving(true);
    const result = await deleteShow(show.id);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    dispatch({ type: "DELETE_SHOW", payload: show.id });
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Show" : "New Show"}
      description={isEdit ? "Update show details" : "Add a new show to your calendar"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Venue *</label>
          <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className={inputClass}>
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
            <label className={labelClass}>Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ShowType)} className={inputClass}>
              {showTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ShowStatus)} className={inputClass}>
              {showStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Guarantee</label>
            <input
              type="number"
              value={guarantee}
              onChange={(e) => setGuarantee(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
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
            placeholder="Any notes about this show..."
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
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
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Show"
        description="This action cannot be undone. The show will be permanently removed."
        loading={saving}
      />
    </Dialog>
  );
}
