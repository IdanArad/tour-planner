"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTemplate, updateTemplate, deleteTemplate } from "@/lib/actions/email";

interface Template {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  template_type: string;
  variables: string[];
}

interface TemplateEditorProps {
  orgId: string;
  templates: Template[];
}

export function TemplateEditor({ orgId, templates: initial }: TemplateEditorProps) {
  const [templates, setTemplates] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateType, setTemplateType] = useState("pitch");

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setName("");
    setSubject("");
    setBody("");
    setTemplateType("pitch");
  }

  function startEdit(t: Template) {
    setEditing(t.id);
    setCreating(false);
    setName(t.name);
    setSubject(t.subject_template);
    setBody(t.body_template);
    setTemplateType(t.template_type);
  }

  function cancel() {
    setEditing(null);
    setCreating(false);
  }

  async function handleSave() {
    if (!name || !subject || !body) return;
    setSaving(true);

    // Extract variables from subject + body
    const vars = new Set<string>();
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = regex.exec(subject + body)) !== null) vars.add(match[1]);

    if (creating) {
      const result = await createTemplate({
        org_id: orgId,
        name,
        subject_template: subject,
        body_template: body,
        template_type: templateType,
        variables: Array.from(vars),
      });
      if (!result.error && result.template) {
        setTemplates((prev) => [result.template!, ...prev]);
      }
    } else if (editing) {
      await updateTemplate(editing, {
        name,
        subject_template: subject,
        body_template: body,
        template_type: templateType,
        variables: Array.from(vars),
      });
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editing
            ? { ...t, name, subject_template: subject, body_template: body, template_type: templateType, variables: Array.from(vars) }
            : t
        )
      );
    }
    setSaving(false);
    setEditing(null);
    setCreating(false);
  }

  async function handleDelete(id: string) {
    const result = await deleteTemplate(id);
    if (!result.error) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const isEditing = creating || editing !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Email Templates</h3>
        {!isEditing && (
          <Button onClick={startCreate} size="sm" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Initial Pitch"
                className="mt-1 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-violet-500/50"
              >
                <option value="pitch">Pitch</option>
                <option value="follow_up">Follow Up</option>
                <option value="thank_you">Thank You</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Subject <span className="text-muted-foreground/60">(use {"{{variable}}"} for placeholders)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Booking inquiry — {{artist_name}} at {{venue_name}}"
              className="mt-1 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{contact_name}},&#10;&#10;I'm reaching out on behalf of {{artist_name}}..."
              rows={6}
              className="mt-1 w-full resize-y rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={cancel} variant="outline" size="sm">
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving || !name || !subject || !body}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      )}

      {templates.length === 0 && !isEditing ? (
        <div className="rounded-xl border border-border/50 bg-card/30 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">No templates yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Create reusable email templates with variable placeholders
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                    {t.template_type}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {t.subject_template}
                </p>
                {t.variables.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {t.variables.map((v) => (
                      <span
                        key={v}
                        className="rounded bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="ml-4 flex items-center gap-1">
                <button
                  onClick={() => startEdit(t)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
