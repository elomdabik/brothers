import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/lib/queryClient';
import { getDb, persistWeb } from './sqlite';
import { isOnline, subscribeOnline } from './network';

type SyncableTable = 'products' | 'offers';

async function getLastSync(table: SyncableTable): Promise<string | null> {
  const db = await getDb();
  const res = await db.query('SELECT value FROM app_meta WHERE key = ?', [
    `last_sync_${table}`,
  ]);
  const rows = (res.values ?? []) as { value: string }[];
  return rows.length ? rows[0].value : null;
}

async function setLastSync(table: SyncableTable, iso: string): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO app_meta(key, value) VALUES(?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [`last_sync_${table}`, iso],
  );
}

function toJson(value: unknown): string | null {
  if (value == null) return null;
  return JSON.stringify(value);
}

function boolToInt(value: unknown): number | null {
  if (value == null) return null;
  return value ? 1 : 0;
}

async function upsertProducts(rows: any[]): Promise<void> {
  if (!rows.length) return;
  const db = await getDb();
  const statements = rows.map((row) => ({
    statement: `INSERT INTO products(
      id, name, category, price, purchase_price, wholesale_price,
      benefits, sizes, image_url, additional_images,
      internal_code, international_code, specifications,
      created_by, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      price = excluded.price,
      purchase_price = excluded.purchase_price,
      wholesale_price = excluded.wholesale_price,
      benefits = excluded.benefits,
      sizes = excluded.sizes,
      image_url = excluded.image_url,
      additional_images = excluded.additional_images,
      internal_code = excluded.internal_code,
      international_code = excluded.international_code,
      specifications = excluded.specifications,
      created_by = excluded.created_by,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at`,
    values: [
      row.id,
      row.name,
      row.category,
      row.price,
      row.purchase_price ?? null,
      row.wholesale_price ?? null,
      toJson(row.benefits ?? []),
      row.sizes ?? null,
      row.image_url ?? null,
      toJson(row.additional_images ?? []),
      row.internal_code ?? null,
      row.international_code ?? null,
      row.specifications ?? null,
      row.created_by ?? null,
      row.created_at,
      row.updated_at,
    ],
  }));
  await db.executeSet(statements as any, true);
}

async function upsertOffers(rows: any[]): Promise<void> {
  if (!rows.length) return;
  const db = await getDb();
  const statements = rows.map((row) => ({
    statement: `INSERT INTO offers(
      id, product_name, old_price, new_price, discount_percent,
      emoji, active, expires_at, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      product_name = excluded.product_name,
      old_price = excluded.old_price,
      new_price = excluded.new_price,
      discount_percent = excluded.discount_percent,
      emoji = excluded.emoji,
      active = excluded.active,
      expires_at = excluded.expires_at,
      created_at = excluded.created_at`,
    values: [
      row.id,
      row.product_name,
      row.old_price,
      row.new_price,
      row.discount_percent,
      row.emoji ?? null,
      boolToInt(row.active),
      row.expires_at ?? null,
      row.created_at,
    ],
  }));
  await db.executeSet(statements as any, true);
}

async function deleteMissingProducts(remoteIds: string[]): Promise<void> {
  const db = await getDb();
  if (!remoteIds.length) {
    await db.run('DELETE FROM products', []);
    return;
  }
  const placeholders = remoteIds.map(() => '?').join(',');
  await db.run(`DELETE FROM products WHERE id NOT IN (${placeholders})`, remoteIds);
}

async function deleteMissingOffers(remoteIds: string[]): Promise<void> {
  const db = await getDb();
  if (!remoteIds.length) {
    await db.run('DELETE FROM offers', []);
    return;
  }
  const placeholders = remoteIds.map(() => '?').join(',');
  await db.run(`DELETE FROM offers WHERE id NOT IN (${placeholders})`, remoteIds);
}

export async function pullProducts(): Promise<number> {
  const lastSync = await getLastSync('products');

  // Always fetch the full id list so we can delete locally-removed rows.
  const { data: idRows, error: idErr } = await supabase
    .from('products')
    .select('id');
  if (idErr) throw idErr;
  const remoteIds = (idRows ?? []).map((r: any) => r.id as string);

  let query = supabase.from('products').select('*');
  if (lastSync) {
    query = query.gte('updated_at', lastSync);
  }
  const { data, error } = await query;
  if (error) throw error;

  await upsertProducts(data ?? []);
  await deleteMissingProducts(remoteIds);
  await setLastSync('products', new Date().toISOString());
  await persistWeb();

  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['product'] });
  queryClient.invalidateQueries({ queryKey: ['similar'] });

  return data?.length ?? 0;
}

export async function pullOffers(): Promise<number> {
  const { data, error } = await supabase.from('offers').select('*');
  if (error) throw error;
  await upsertOffers(data ?? []);
  await deleteMissingOffers((data ?? []).map((r: any) => r.id as string));
  await setLastSync('offers', new Date().toISOString());
  await persistWeb();

  queryClient.invalidateQueries({ queryKey: ['offers'] });
  return data?.length ?? 0;
}

export async function syncAll(opts: { force?: boolean } = {}): Promise<void> {
  if (!opts.force) {
    const online = await isOnline();
    if (!online) return;
  }
  try {
    await Promise.all([pullProducts(), pullOffers()]);
  } catch (err) {
    // Sync failures are non-fatal — log and continue with cached data.
    // eslint-disable-next-line no-console
    console.warn('[sync] failed', err);
  }
}

export async function refreshTable(table: SyncableTable): Promise<void> {
  try {
    if (table === 'products') await pullProducts();
    else await pullOffers();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[refreshTable:${table}] failed`, err);
  }
}

let autoSyncWired = false;
export function wireAutoSync(): void {
  if (autoSyncWired) return;
  autoSyncWired = true;
  subscribeOnline((online) => {
    if (online) void syncAll();
  });
}
