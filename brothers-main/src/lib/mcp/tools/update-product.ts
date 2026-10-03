import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { toProductJson } from "../shape";

export default defineTool({
  name: "update_product",
  title: "Update product",
  description: "Update fields of an existing product. Only the fields you pass are changed.",
  inputSchema: {
    id: z.string().uuid().describe("Id of the product to update."),
    name: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    internal_code: z.string().trim().min(1).optional(),
    international_code: z.string().trim().optional(),
    price: z.number().nonnegative().optional(),
    wholesale_price: z.number().nonnegative().optional(),
    purchase_price: z.number().nonnegative().optional(),
    sizes: z.string().trim().optional(),
    specifications: z.string().trim().optional(),
    image_url: z.string().url().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id, ...patch }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const fields = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    if (!Object.keys(fields).length)
      return { content: [{ type: "text", text: "No fields to update" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("products")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) return { content: [{ type: "text", text: "Product not found" }], isError: true };
    const product = toProductJson(data[0]);
    return {
      content: [{ type: "text", text: JSON.stringify(product) }],
      structuredContent: { product },
    };
  },
});
