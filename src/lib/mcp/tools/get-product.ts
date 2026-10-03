import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { toProductJson } from "../shape";

export default defineTool({
  name: "get_product",
  title: "Get product",
  description: "Fetch one product with all its details, by id or by internal code.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Product id."),
    internal_code: z.string().trim().optional().describe("Internal product code."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, internal_code }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    if (!id && !internal_code)
      return { content: [{ type: "text", text: "Provide id or internal_code" }], isError: true };
    let request = supabaseForUser(ctx).from("products").select("*").limit(1);
    request = id ? request.eq("id", id) : request.eq("internal_code", internal_code!);
    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) return { content: [{ type: "text", text: "Product not found" }], isError: true };
    const product = toProductJson(data[0]);
    return {
      content: [{ type: "text", text: JSON.stringify(product) }],
      structuredContent: { product },
    };
  },
});
