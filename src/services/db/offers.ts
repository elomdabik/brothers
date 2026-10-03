import type { Tables } from '@/integrations/supabase/types';
import { getDb } from './sqlite';

export type OfferRow = Tables<'offers'>;

type RawOfferRow = Omit<OfferRow, 'active'> & { active: number | null };

function mapOffer(row: RawOfferRow): OfferRow {
  return {
    ...row,
    active: row.active == null ? null : row.active === 1,
  } as OfferRow;
}

export async function getActiveOffers(): Promise<OfferRow[]> {
  const db = await getDb();
  const nowIso = new Date().toISOString();
  const res = await db.query(
    `SELECT * FROM offers
     WHERE active = 1
       AND (expires_at IS NULL OR expires_at > ?)
     ORDER BY created_at DESC`,
    [nowIso],
  );
  const rows = (res.values ?? []) as RawOfferRow[];
  return rows.map(mapOffer);
}

export async function getAllOffers(): Promise<OfferRow[]> {
  const db = await getDb();
  const res = await db.query(
    'SELECT * FROM offers ORDER BY created_at DESC',
    [],
  );
  const rows = (res.values ?? []) as RawOfferRow[];
  return rows.map(mapOffer);
}
