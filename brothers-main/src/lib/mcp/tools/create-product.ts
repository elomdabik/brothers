import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { toProductJson } from "../shape";

export default defineTool({
  name: "create_product",
  title: "Create product",
  description: "Add a new product to the store catalog.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Product name."),
    category: z.string().trim().min(1).describe("Product category."),
    internal_code: z.string().trim().min(1).describe("Internal product code (required)."),
    price: z.number().nonnegative().describe("Retail selling price."),
    wholesale_price: z.number().nonnegative().optional().describe("Wholesale price."),
    purchase_price: z.number().nonnegative().optional().describe("Purchase cost price."),
    international_code: z.string().trim().optional().describe("International barcode (optional)."),
    sizes: z.string().trim().optional().describe("Available sizes, free text."),
    specifications: z.string().trim().optional().describe("Product specifications, free text."),
    image_url: z.string().url().optional().describe("Main image URL."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("products")
      .insert({ ...input, created_by: ctx.getUserId() })
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const product = toProductJson(data?.[0] ?? {});
    return {
      content: [{ type: "text", text: JSON.stringify(product) }],
      structuredContent: { product },
    };
  },
});
