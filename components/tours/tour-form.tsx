"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";
import { addTour, updateTour, deleteTour } from "@/lib/actions/tours";
import type { Tour, TourStatus } from "@/types";

const tourStatuses: { value: TourStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface TourFormProps {
  open: boolean;
  onClose: () => void;
  tour?: Tour;
}

export function TourForm({ open, onClose, tour }: TourFormProps) {
  const { state, dispatch } = useStore();
  const isEdit = !!tour;

  const [name, setName] = useState(tour?.name ?? "");
  const [startDate, setStartDate] = useState(tour?.startDate ?? "");
  const [endDate, setEndDate] = useState(tour?.endDate ?? "");
  const [status, setStatus] = useState<TourStatus>(tour?.status ?? "planning");
  const [notes, setNotes] = useState(tour?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.orgId || !state.artist.id) {
      setError("App data not loaded yet");
      return;
    }
    if (!name) {
      setError("Tour name is required");
      return;
    }
    setSaving(true);
    setError("");

    if (isEdit) {
      const result = await updateTour(tour.id, {
        name,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
        notes: notes || null,
      });
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    } else {
      const result = await addTour({
        org_id: state.orgId,
        artist_id: state.artist.id,
        name,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
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
    if (!tour) return;
    setSaving(true);
    const result = await deleteTour(tour.id);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    dispatch({ type: "DELETE_TOUR", payload: tour.id });
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Tour" : "New Tour"}
      description={isEdit ? "Update tour details" : "Plan a new tour"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tour name"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TourStatus)} className={inputClass}>
            {tourStatuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any notes about this tour..."
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
        title="Delete Tour"
        description="This action cannot be undone. The tour will be permanently removed."
        loading={saving}
      />
    </Dialog>
  );
}
