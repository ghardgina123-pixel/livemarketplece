import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  room: z.string().min(1).max(128),
  identity: z.string().min(1).max(128),
  name: z.string().min(1).max(128).optional(),
  canPublish: z.boolean().optional(),
});

export const issueLiveKitToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error("LIVEKIT_NOT_CONFIGURED");
    }
    // Force identity to the authenticated user; ignore client-supplied identity for trust.
    const identity = context.userId;
    // Derive canPublish server-side: only the owner of the store linked to the
    // live room may publish. All other callers get subscribe-only tokens.
    let canPublish = false;
    if (data.canPublish) {
      const { data: live } = await context.supabase
        .from("lives")
        .select("store_id, stores:store_id(owner_id)")
        .eq("livekit_room", data.room)
        .maybeSingle();
      const ownerId = (live as { stores?: { owner_id?: string } } | null)?.stores?.owner_id;
      canPublish = !!ownerId && ownerId === context.userId;
    }
    const { AccessToken } = await import("livekit-server-sdk");
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: data.name ?? identity,
      ttl: 60 * 60, // 1h
    });
    at.addGrant({
      room: data.room,
      roomJoin: true,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();
    return { token, url: wsUrl };
  });