import { createClient } from "@/lib/supabase/server";
import { Send, FileText, BarChart3 } from "lucide-react";

export default async function EmailPage() {
  const supabase = await createClient();

  const [templatesResult, messagesResult] = await Promise.all([
    supabase.from("email_templates").select("*", { count: "exact", head: true }),
    supabase.from("email_messages").select("status", { count: "exact" }),
  ]);

  const templateCount = templatesResult.count ?? 0;
  const messages = messagesResult.data ?? [];
  const sent = messages.filter((m) => m.status === "sent" || m.status === "delivered" || m.status === "opened").length;
  const opened = messages.filter((m) => m.status === "opened").length;
  const bounced = messages.filter((m) => m.status === "bounced").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email</h1>
        <p className="mt-1 text-muted-foreground">
          Manage templates, send pitches, and track responses
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-5 w-5 text-violet-400" />
            Templates
          </div>
          <p className="mt-1.5 text-3xl font-bold">{templateCount}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Send className="h-5 w-5 text-emerald-400" />
            Sent
          </div>
          <p className="mt-1.5 text-3xl font-bold">{sent}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {opened} opened{bounced > 0 ? ` / ${bounced} bounced` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            Open Rate
          </div>
          <p className="mt-1.5 text-3xl font-bold">
            {sent > 0 ? `${Math.round((opened / sent) * 100)}%` : "\u2014"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 p-12 text-center">
        <Send className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          Email automation is being set up. Configure your Resend API key in environment variables to get started.
        </p>
        <p className="mt-2 text-sm text-muted-foreground/60">
          Once configured, you can create templates, send pitch emails, and track opens/bounces.
        </p>
      </div>
    </div>
  );
}
