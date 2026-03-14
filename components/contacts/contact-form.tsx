"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { addContact, updateContact, deleteContact } from "@/lib/actions/contacts";
import type { Contact } from "@/types";

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  venueId: string;
  contact?: Contact;
}

export function ContactForm({ open, onClose, venueId, contact }: ContactFormProps) {
  const { state, dispatch } = useStore();
  const isEdit = !!contact;

  const [name, setName] = useState(contact?.name ?? "");
  const [role, setRole] = useState(contact?.role ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");

    if (isEdit) {
      const result = await updateContact(contact.id, {
        name,
        role: role || null,
        email: email || null,
        phone: phone || null,
      });
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    } else {
      const result = await addContact({
        org_id: state.orgId,
        venue_id: venueId,
        name,
        role: role || null,
        email: email || null,
        phone: phone || null,
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
    if (!contact) return;
    setSaving(true);
    const result = await deleteContact(contact.id);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    dispatch({ type: "DELETE_CONTACT", payload: { venueId, contactId: contact.id } });
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Contact" : "Add Contact"}
      description={isEdit ? "Update contact details" : "Add a contact for this venue"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Booking Agent, Promoter"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 890"
              className={inputClass}
            />
          </div>
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
              {saving ? "Saving..." : isEdit ? "Update" : "Add Contact"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
