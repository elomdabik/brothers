export const toProductJson = (row: Record<string, unknown>) => ({
  id: String(row.id ?? ""),
  name: String(row.name ?? ""),
  category: String(row.category ?? ""),
  price: Number(row.price ?? 0),
  purchase_price: row.purchase_price == null ? null : Number(row.purchase_price),
  wholesale_price: row.wholesale_price == null ? null : Number(row.wholesale_price),
  internal_code: row.internal_code == null ? null : String(row.internal_code),
  international_code: row.international_code == null ? null : String(row.international_code),
  sizes: row.sizes == null ? null : String(row.sizes),
  specifications: row.specifications == null ? null : String(row.specifications),
  benefits: Array.isArray(row.benefits) ? row.benefits.map((b) => String(b)) : [],
  image_url: row.image_url == null ? null : String(row.image_url),
  additional_images: Array.isArray(row.additional_images)
    ? row.additional_images.map((i) => String(i))
    : [],
  created_at: row.created_at == null ? null : String(row.created_at),
  updated_at: row.updated_at == null ? null : String(row.updated_at),
});

export const toOfferJson = (row: Record<string, unknown>) => ({
  id: String(row.id ?? ""),
  product_name: String(row.product_name ?? ""),
  old_price: Number(row.old_price ?? 0),
  new_price: Number(row.new_price ?? 0),
  discount_percent: Number(row.discount_percent ?? 0),
  emoji: row.emoji == null ? null : String(row.emoji),
  active: Boolean(row.active),
  expires_at: row.expires_at == null ? null : String(row.expires_at),
  created_at: row.created_at == null ? null : String(row.created_at),
});
