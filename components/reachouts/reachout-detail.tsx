"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Send, User, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { EmailTimeline } from "@/components/email/email-timeline";
import { EmailComposer } from "@/components/email/email-composer";
import { useStore, getVenueById, getContactById } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { Reachout } from "@/types";

interface EmailMessage {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
}

interface ReachoutDetailProps {
  open: boolean;
  onClose: () => void;
  reachout: Reachout;
}

export function ReachoutDetail({ open, onClose, reachout }: ReachoutDetailProps) {
  const { state } = useStore();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  const venue = getVenueById(state, reachout.venueId);
  const contact = reachout.contactId ? getContactById(state, reachout.contactId) : undefined;

  useEffect(() => {
    if (!open) return;
    async function fetchEmails() {
      setLoadingEmails(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("email_messages")
        .select("id, to_email, subject, status, sent_at, opened_at, created_at")
        .eq("reachout_id", reachout.id)
        .order("created_at", { ascending: false });
      setEmails((data as EmailMessage[]) ?? []);
      setLoadingEmails(false);
    }
    fetchEmails();
  }, [open, reachout.id]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={venue?.name ?? "Reachout Detail"}
      description={`${venue?.city ?? ""}${venue?.country ? `, ${venue.country}` : ""}`}
    >
      <div className="space-y-5">
        {/* Contact info */}
        {contact && (
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              {contact.name}
              {contact.role && (
                <span className="text-xs text-muted-foreground">({contact.role})</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {contact.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {contact.phone}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reachout details */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Method: <strong className="text-foreground capitalize">{reachout.method ?? "—"}</strong></span>
          <span>Status: <strong className="text-foreground capitalize">{reachout.status}</strong></span>
          {reachout.notes && (
            <p className="w-full text-sm">{reachout.notes}</p>
          )}
        </div>

        {/* Email history */}
        <div>
          {loadingEmails ? (
            <p className="text-sm text-muted-foreground">Loading email history...</p>
          ) : (
            <EmailTimeline emails={emails} />
          )}
        </div>

        {/* Send follow-up / compose */}
        {!showComposer ? (
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Send className="h-4 w-4" />
            {emails.length > 0 ? "Send Follow-up" : "Send Email"}
          </button>
        ) : (
          <EmailComposer
            orgId={state.orgId}
            reachoutId={reachout.id}
            defaultTo={contact?.email ?? ""}
            onClose={() => setShowComposer(false)}
            onSent={() => {
              setShowComposer(false);
              // Refresh emails
              const supabase = createClient();
              supabase
                .from("email_messages")
                .select("id, to_email, subject, status, sent_at, opened_at, created_at")
                .eq("reachout_id", reachout.id)
                .order("created_at", { ascending: false })
                .then(({ data }) => setEmails((data as EmailMessage[]) ?? []));
            }}
          />
        )}
      </div>
    </Dialog>
  );
}
