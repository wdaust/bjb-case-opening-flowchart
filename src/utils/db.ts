import { neon } from '@neondatabase/serverless';
import type { SectionData } from '../types/flowchart.ts';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL as string;

function getSql() {
  if (!DATABASE_URL) {
    console.warn('No VITE_NEON_DATABASE_URL — falling back to local-only mode');
    return null;
  }
  return neon(DATABASE_URL);
}

/** Create the sections table if it doesn't exist */
export async function initDb(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    // Check if table exists first to avoid Neon type-conflict quirk
    const check = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'sections'
      ) AS exists
    `;
    if (!check[0].exists) {
      await sql`
        CREATE TABLE sections (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT now()
        )
      `;
    }
    return true;
  } catch (err) {
    console.error('Failed to init DB:', err);
    return false;
  }
}

/** Load a saved section from Neon. Returns null if not found. */
export async function loadSection(sectionId: string): Promise<SectionData | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`SELECT data FROM sections WHERE id = ${sectionId}`;
    if (rows.length > 0) {
      return rows[0].data as SectionData;
    }
    return null;
  } catch (err) {
    console.error(`Failed to load section ${sectionId}:`, err);
    return null;
  }
}

/** Load all saved sections from Neon */
export async function loadAllSections(): Promise<Record<string, SectionData>> {
  const sql = getSql();
  if (!sql) return {};
  try {
    const rows = await sql`SELECT id, data FROM sections`;
    const result: Record<string, SectionData> = {};
    for (const row of rows) {
      result[row.id as string] = row.data as SectionData;
    }
    return result;
  } catch (err) {
    console.error('Failed to load sections:', err);
    return {};
  }
}

/** Save (upsert) a section to Neon */
export async function saveSection(section: SectionData): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO sections (id, data, updated_at)
      VALUES (${section.id}, ${JSON.stringify(section)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET
        data = ${JSON.stringify(section)}::jsonb,
        updated_at = now()
    `;
    return true;
  } catch (err) {
    console.error(`Failed to save section ${section.id}:`, err);
    return false;
  }
}

/** Delete all saved sections (reset to defaults) */
export async function clearAllSections(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await sql`DELETE FROM sections`;
    return true;
  } catch (err) {
    console.error('Failed to clear sections:', err);
    return false;
  }
}

// ─── Generic JSONB helpers (used by MOS and other pages) ─────────────────────

/** Load a generic JSONB blob from the sections table by id */
export async function loadGenericSection<T>(id: string): Promise<T | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`SELECT data FROM sections WHERE id = ${id}`;
    return rows.length > 0 ? (rows[0].data as T) : null;
  } catch (err) {
    console.error(`Failed to load generic section ${id}:`, err);
    return null;
  }
}

/** Save a generic JSONB blob to the sections table by id */
export async function saveGenericSection<T>(id: string, data: T): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO sections (id, data, updated_at)
      VALUES (${id}, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET
        data = ${JSON.stringify(data)}::jsonb,
        updated_at = now()
    `;
    return true;
  } catch (err) {
    console.error(`Failed to save generic section ${id}:`, err);
    return false;
  }
}

/** Load approvals/notes from spec_approvals table */
export async function loadApprovals(pageId: string): Promise<{ checkboxes: Record<string, { checked: boolean; date: string }>; notes: string } | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`SELECT checkboxes, notes FROM spec_approvals WHERE page_id = ${pageId}`;
    return rows.length > 0 ? { checkboxes: rows[0].checkboxes as Record<string, { checked: boolean; date: string }>, notes: (rows[0].notes as string) || '' } : null;
  } catch (err) {
    console.error(`Failed to load approvals for ${pageId}:`, err);
    return null;
  }
}

/** Save approvals/notes to spec_approvals table */
export async function saveApprovals(pageId: string, checkboxes: Record<string, { checked: boolean; date: string }>, notes: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO spec_approvals (page_id, checkboxes, notes, updated_at)
      VALUES (${pageId}, ${JSON.stringify(checkboxes)}::jsonb, ${notes}, now())
      ON CONFLICT (page_id) DO UPDATE SET
        checkboxes = ${JSON.stringify(checkboxes)}::jsonb,
        notes = ${notes},
        updated_at = now()
    `;
    return true;
  } catch (err) {
    console.error(`Failed to save approvals for ${pageId}:`, err);
    return false;
  }
}
