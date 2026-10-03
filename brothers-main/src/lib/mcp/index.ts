import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProductsTool from "./tools/list-products";
import getProductTool from "./tools/get-product";
import listOffersTool from "./tools/list-offers";
import createProductTool from "./tools/create-product";
import updateProductTool from "./tools/update-product";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "my-app-mcp",
  title: "الاخوه لتجهيزات العرائس",
  version: "0.1.0",
  instructions:
    "Tools for the bridal and home-appliance store catalog. Use `list_products` to search the catalog, `get_product` for full details of one item, `list_offers` for current promotions, and `create_product` / `update_product` to manage catalog entries.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProductsTool, getProductTool, listOffersTool, createProductTool, updateProductTool],
});
