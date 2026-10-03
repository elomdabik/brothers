import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { toProductJson } from "../shape";

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "List or search the store catalog. Optionally filter by category or by a text query matching the product name, internal code, or international code.",
  inputSchema: {
    query: z.string().trim().optional().describe("Text to match in name or product codes."),
    category: z.string().trim().optional().describe("Exact category name to filter by."),
    limit: z.number().int().min(1).max(100).optional().describe("Maximum rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let request = supabaseForUser(ctx)
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (category) request = request.eq("category", category);
    if (query)
      request = request.or(
        `name.ilike.%${query}%,internal_code.ilike.%${query}%,international_code.ilike.%${query}%`,
      );
    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const products = (data ?? []).map(toProductJson);
    return {
      content: [{ type: "text", text: JSON.stringify(products) }],
      structuredContent: { products },
    };
  },
});
