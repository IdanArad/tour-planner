-- Migration 005: Automation rules + Activity log
-- Rules engine for auto-follow-ups, digests, notifications
-- Activity log for org-wide audit trail

-- Automation rules (org-scoped)
CREATE TABLE automation_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  rule_type       text NOT NULL
                  CHECK (rule_type IN ('auto_follow_up', 'auto_pitch', 'notification', 'digest')),
  trigger_config  jsonb NOT NULL DEFAULT '{}',
  -- auto_follow_up: { days_after_send: 5, max_follow_ups: 3, template_id: "..." }
  -- auto_pitch:    { min_match_score: 75, template_id: "...", auto_send: false }
  -- notification:  { event: "reply_received", channels: ["email", "slack"] }
  -- digest:        { frequency: "weekly", day: "monday", include: ["new_matches", "pending_reachouts"] }
  action_config   jsonb NOT NULL DEFAULT '{}',
  -- { template_id: "...", email_account_id: "...", notify_user_ids: [...] }
  enabled         boolean NOT NULL DEFAULT true,
  last_run_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Activity log (org-scoped audit trail)
CREATE TABLE activity_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL for system actions
  entity_type   text NOT NULL,                        -- 'show', 'reachout', 'venue', 'contact', 'email', 'match'
  entity_id     uuid,
  action        text NOT NULL,                        -- 'created', 'updated', 'deleted', 'status_changed', 'email_sent', 'email_opened'
  details       jsonb DEFAULT '{}',                   -- { old_status: "sent", new_status: "replied", ... }
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_automation_rules_org ON automation_rules(org_id);
CREATE INDEX idx_automation_rules_type ON automation_rules(rule_type);
CREATE INDEX idx_automation_rules_enabled ON automation_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_activity_log_org ON activity_log(org_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view rules"
  ON automation_rules FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Admins+ can manage rules"
  ON automation_rules FOR ALL
  USING (user_has_role(org_id, ARRAY['admin', 'owner']));

CREATE POLICY "Org members can view activity"
  ON activity_log FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "System and agents can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));
