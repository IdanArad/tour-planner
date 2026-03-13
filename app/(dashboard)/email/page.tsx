import { createClient } from "@/lib/supabase/server";
import { Send, FileText, BarChart3 } from "lucide-react";
import { TemplateEditor } from "@/components/email/template-editor";
import { EmailTimeline } from "@/components/email/email-timeline";

export default async function EmailPage() {
  const supabase = await createClient();

  // Get org_id from auth user
  const { data: { user } } = await supabase.auth.getUser();
  let orgId = "";
  if (user) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    orgId = membership?.org_id ?? "";
  }

  const [templatesResult, messagesResult] = await Promise.all([
    supabase
      .from("email_templates")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("email_messages")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const templates = templatesResult.data ?? [];
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-5 w-5 text-violet-400" />
            Templates
          </div>
          <p className="mt-1.5 text-3xl font-bold">{templates.length}</p>
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

      {/* Templates + Timeline side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TemplateEditor orgId={orgId} templates={templates} />
        <EmailTimeline emails={messages} />
      </div>
    </div>
  );
}
