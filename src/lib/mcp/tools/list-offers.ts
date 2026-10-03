import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { toOfferJson } from "../shape";

export default defineTool({
  name: "list_offers",
  title: "List offers",
  description: "List the store's promotional offers. By default only active, non-expired offers.",
  inputSchema: {
    include_inactive: z
      .boolean()
      .optional()
      .describe("Include inactive and expired offers (default false)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_inactive }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let request = supabaseForUser(ctx)
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });
    if (!include_inactive) request = request.eq("active", true);
    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const now = Date.now();
    const offers = (data ?? [])
      .map(toOfferJson)
      .filter(
        (offer) =>
          include_inactive || !offer.expires_at || new Date(offer.expires_at).getTime() > now,
      );
    return {
      content: [{ type: "text", text: JSON.stringify(offers) }],
      structuredContent: { offers },
    };
  },
});
