import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  room: z.string().min(1).max(128),
  identity: z.string().min(1).max(128),
  name: z.string().min(1).max(128).optional(),
  canPublish: z.boolean().optional(),
});

export const issueLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error("LIVEKIT_NOT_CONFIGURED");
    }
    const { AccessToken } = await import("livekit-server-sdk");
    const at = new AccessToken(apiKey, apiSecret, {
      identity: data.identity,
      name: data.name ?? data.identity,
      ttl: 60 * 60, // 1h
    });
    at.addGrant({
      room: data.room,
      roomJoin: true,
      canPublish: data.canPublish ?? false,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();
    return { token, url: wsUrl };
  });