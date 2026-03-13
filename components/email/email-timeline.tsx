"use client";

import { Send, CheckCircle2, Eye, AlertTriangle, XCircle, Clock } from "lucide-react";

interface EmailMessage {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
}

interface EmailTimelineProps {
  emails: EmailMessage[];
}

const statusConfig: Record<string, { icon: typeof Send; color: string; label: string }> = {
  queued: { icon: Clock, color: "text-muted-foreground", label: "Queued" },
  sent: { icon: Send, color: "text-blue-400", label: "Sent" },
  delivered: { icon: CheckCircle2, color: "text-emerald-400", label: "Delivered" },
  opened: { icon: Eye, color: "text-violet-400", label: "Opened" },
  bounced: { icon: AlertTriangle, color: "text-amber-400", label: "Bounced" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
};

function formatDateTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EmailTimeline({ emails }: EmailTimelineProps) {
  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-center">
        <Send className="mx-auto h-6 w-6 text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">No emails sent yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Email History</h4>
      <div className="space-y-0">
        {emails.map((email, i) => {
          const config = statusConfig[email.status] ?? statusConfig.queued;
          const Icon = config.icon;
          return (
            <div key={email.id} className="relative flex gap-3 pb-4">
              {/* Timeline line */}
              {i < emails.length - 1 && (
                <div className="absolute left-[13px] top-7 h-full w-px bg-border/50" />
              )}
              {/* Icon */}
              <div className={`relative z-10 mt-0.5 rounded-full border border-border/50 bg-card p-1.5 ${config.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-muted-foreground/60">
                    {formatDateTime(email.sent_at ?? email.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm">{email.subject}</p>
                <p className="text-xs text-muted-foreground">{email.to_email}</p>
                {email.opened_at && email.status === "opened" && (
                  <p className="mt-0.5 text-xs text-violet-400/70">
                    Opened {formatDateTime(email.opened_at)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
