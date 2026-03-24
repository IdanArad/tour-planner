"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";
import { addVenue, updateVenue, deleteVenue } from "@/lib/actions/venues";
import type { Venue } from "@/types";

interface VenueFormProps {
  open: boolean;
  onClose: () => void;
  venue?: Venue;
}

export function VenueForm({ open, onClose, venue }: VenueFormProps) {
  const { state, dispatch } = useStore();
  const isEdit = !!venue;

  const [name, setName] = useState(venue?.name ?? "");
  const [city, setCity] = useState(venue?.city ?? "");
  const [country, setCountry] = useState(venue?.country ?? "");
  const [capacity, setCapacity] = useState(venue?.capacity?.toString() ?? "");
  const [notes, setNotes] = useState(venue?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.orgId) {
      setError("App data not loaded yet");
      return;
    }
    if (!name || !city) {
      setError("Name and city are required");
      return;
    }
    setSaving(true);
    setError("");

    if (isEdit) {
      const result = await updateVenue(venue.id, {
        name,
        city,
        country: country || null,
        capacity: capacity ? Number(capacity) : null,
        notes: notes || null,
      });
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    } else {
      const result = await addVenue({
        org_id: state.orgId,
        name,
        city,
        country: country || undefined,
        capacity: capacity ? Number(capacity) : null,
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
    if (!venue) return;
    setSaving(true);
    const result = await deleteVenue(venue.id);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    dispatch({ type: "DELETE_VENUE", payload: venue.id });
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Venue" : "Add Venue"}
      description={isEdit ? "Update venue details" : "Add a new venue to your database"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Venue name"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Capacity</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any notes about this venue..."
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
              {saving ? "Saving..." : isEdit ? "Update" : "Add Venue"}
            </button>
          </div>
        </div>
      </form>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Venue"
        description="This action cannot be undone. The venue and its contacts will be permanently removed."
        loading={saving}
      />
    </Dialog>
  );
}
