import { createAdminClient } from "@/lib/supabase/admin";

interface WebhookEvent {
  type: string;
  data: {
    email_id: string;
    [key: string]: unknown;
  };
}

export async function processWebhookEvent(event: WebhookEvent) {
  const supabase = createAdminClient();
  const externalId = event.data.email_id;

  switch (event.type) {
    case "email.delivered":
      await supabase
        .from("email_messages")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("external_id", externalId);
      break;

    case "email.opened":
      await supabase
        .from("email_messages")
        .update({
          status: "opened",
          opened_at: new Date().toISOString(),
        })
        .eq("external_id", externalId);
      break;

    case "email.bounced":
      await supabase
        .from("email_messages")
        .update({ status: "bounced" })
        .eq("external_id", externalId);
      break;
  }
}
