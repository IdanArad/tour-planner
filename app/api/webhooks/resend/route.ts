import { NextRequest, NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/email/tracker";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (webhookSecret) {
      const svixId = request.headers.get("svix-id");
      const svixTimestamp = request.headers.get("svix-timestamp");
      const svixSignature = request.headers.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json(
          { error: "Missing webhook signature headers" },
          { status: 401 }
        );
      }

      // Verify using svix — dynamic import to keep it optional
      const { Webhook } = await import("svix");
      const wh = new Webhook(webhookSecret);
      const body = await request.text();

      try {
        wh.verify(body, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
      } catch {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }

      const event = JSON.parse(body);
      await processWebhookEvent(event);
    } else {
      // No secret configured — parse body directly
      const event = await request.json();
      await processWebhookEvent(event);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Resend Webhook] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
