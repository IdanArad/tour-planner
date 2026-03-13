"use client";

import { useState } from "react";
import { Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendEmail } from "@/lib/actions/email";

interface EmailComposerProps {
  orgId: string;
  reachoutId?: string;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onClose?: () => void;
  onSent?: () => void;
}

export function EmailComposer({
  orgId,
  reachoutId,
  defaultTo = "",
  defaultSubject = "",
  defaultBody = "",
  onClose,
  onSent,
}: EmailComposerProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!to || !subject || !body) {
      setError("All fields are required");
      return;
    }
    setSending(true);
    setError(null);
    const result = await sendEmail({
      org_id: orgId,
      reachout_id: reachoutId,
      to_email: to,
      subject,
      body_html: body.replace(/\n/g, "<br>"),
    });
    setSending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
      onSent?.();
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <Send className="mx-auto h-8 w-8 text-emerald-400" />
        <p className="mt-3 font-medium text-emerald-400">Email sent successfully</p>
        <p className="mt-1 text-sm text-muted-foreground">To: {to}</p>
        {onClose && (
          <Button onClick={onClose} variant="outline" size="sm" className="mt-4">
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Compose Email</h3>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent/50">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="booking@venue.com"
            className="mt-1 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Booking inquiry — [Artist Name]"
            className="mt-1 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email..."
            rows={8}
            className="mt-1 w-full resize-y rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSend}
          size="sm"
          disabled={sending || !to || !subject || !body}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {sending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-4 w-4" />
          )}
          {sending ? "Sending..." : "Send Email"}
        </Button>
      </div>
    </div>
  );
}
