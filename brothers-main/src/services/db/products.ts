import type { Tables } from '@/integrations/supabase/types';
import { getDb } from './sqlite';

export type ProductRow = Tables<'products'>;

type RawProductRow = Omit<ProductRow, 'benefits' | 'additional_images'> & {
  benefits: string | null;
  additional_images: string | null;
};

function parseJsonArray(value: string | null): string[] | null {
  if (value == null) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function mapProduct(row: RawProductRow): ProductRow {
  return {
    ...row,
    benefits: parseJsonArray(row.benefits),
    additional_images: parseJsonArray(row.additional_images),
  } as ProductRow;
}

export type GetProductsOptions = {
  category?: string;
  limit?: number;
  orderBy?: 'created_at';
  ascending?: boolean;
};

export async function getProducts(options: GetProductsOptions = {}): Promise<ProductRow[]> {
  const db = await getDb();
  const params: (string | number)[] = [];
  const where: string[] = [];

  if (options.category) {
    where.push('category = ?');
    params.push(options.category);
  }

  let sql = 'SELECT * FROM products';
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  const orderCol = options.orderBy ?? 'created_at';
  const order = options.ascending ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${orderCol} ${order}`;
  if (typeof options.limit === 'number') {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  const res = await db.query(sql, params);
  const rows = (res.values ?? []) as RawProductRow[];
  return rows.map(mapProduct);
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  if (!id) return null;
  const db = await getDb();
  const res = await db.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  const rows = (res.values ?? []) as RawProductRow[];
  return rows.length ? mapProduct(rows[0]) : null;
}

export async function getSimilarProducts(
  category: string,
  excludeId: string,
  limit = 8,
): Promise<ProductRow[]> {
  const db = await getDb();
  const res = await db.query(
    'SELECT * FROM products WHERE category = ? AND id != ? ORDER BY created_at DESC LIMIT ?',
    [category, excludeId, limit],
  );
  const rows = (res.values ?? []) as RawProductRow[];
  return rows.map(mapProduct);
}

export async function getCategories(): Promise<string[]> {
  const db = await getDb();
  const res = await db.query(
    'SELECT DISTINCT category FROM products ORDER BY category ASC',
    [],
  );
  const rows = (res.values ?? []) as { category: string }[];
  return rows.map((r) => r.category);
}
