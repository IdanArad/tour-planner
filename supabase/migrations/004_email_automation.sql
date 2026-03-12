-- Migration 004: Email automation tables
-- Supports email accounts, templates, tracked messages

-- Email sending accounts (org-scoped)
CREATE TABLE email_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_address     text NOT NULL,
  display_name      text,
  provider          text NOT NULL DEFAULT 'resend',   -- 'resend', 'smtp'
  api_key_encrypted text,                             -- encrypted at app layer
  daily_limit       integer NOT NULL DEFAULT 50,
  is_default        boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Email templates (org-scoped)
CREATE TABLE email_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              text NOT NULL,
  subject_template  text NOT NULL,                    -- "Hey {{contact_name}}, {{artist_name}} at {{venue_name}}?"
  body_template     text NOT NULL,
  template_type     text NOT NULL DEFAULT 'pitch'
                    CHECK (template_type IN ('pitch', 'follow_up', 'thank_you', 'custom')),
  variables         text[] DEFAULT '{}',              -- ['artist_name', 'venue_name', 'contact_name', ...]
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Individual email messages (org-scoped, linked to reachouts)
CREATE TABLE email_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reachout_id     uuid REFERENCES reachouts(id) ON DELETE SET NULL,
  template_id     uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  account_id      uuid REFERENCES email_accounts(id) ON DELETE SET NULL,
  to_email        text NOT NULL,
  subject         text NOT NULL,
  body_html       text NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'queued', 'sent', 'delivered', 'opened', 'bounced', 'failed')),
  external_id     text,                               -- Resend message ID for tracking
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_accounts_org ON email_accounts(org_id);
CREATE INDEX idx_email_templates_org ON email_templates(org_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_messages_org ON email_messages(org_id);
CREATE INDEX idx_email_messages_reachout ON email_messages(reachout_id);
CREATE INDEX idx_email_messages_status ON email_messages(status);
CREATE INDEX idx_email_messages_sent ON email_messages(sent_at);

-- RLS
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view email accounts"
  ON email_accounts FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Admins+ can manage email accounts"
  ON email_accounts FOR ALL
  USING (user_has_role(org_id, ARRAY['admin', 'owner']));

CREATE POLICY "Org members can view templates"
  ON email_templates FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Agents+ can manage templates"
  ON email_templates FOR ALL
  USING (user_has_role(org_id, ARRAY['agent', 'admin', 'owner']));

CREATE POLICY "Org members can view messages"
  ON email_messages FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Agents+ can manage messages"
  ON email_messages FOR ALL
  USING (user_has_role(org_id, ARRAY['agent', 'admin', 'owner']));
