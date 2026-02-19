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
