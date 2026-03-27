import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL as string;

function getSql() {
  if (!DATABASE_URL) return null;
  return neon(DATABASE_URL);
}

export async function initTrackingDb(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id BIGSERIAL PRIMARY KEY,
        user_token TEXT,
        path TEXT,
        referrer TEXT,
        session_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS click_events (
        id BIGSERIAL PRIMARY KEY,
        user_token TEXT,
        path TEXT,
        target_tag TEXT,
        target_text VARCHAR(100),
        target_id TEXT,
        target_class VARCHAR(200),
        x INT,
        y INT,
        session_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    return true;
  } catch (err) {
    console.error('Failed to init tracking DB:', err);
    return false;
  }
}

export interface PageViewData {
  userToken: string;
  path: string;
  referrer: string;
  sessionId: string;
}

export async function insertPageView(data: PageViewData): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO page_views (user_token, path, referrer, session_id)
      VALUES (${data.userToken}, ${data.path}, ${data.referrer}, ${data.sessionId})
    `;
  } catch (err) {
    console.error('Failed to insert page view:', err);
  }
}

export interface ClickEventData {
  userToken: string;
  path: string;
  targetTag: string;
  targetText: string;
  targetId: string;
  targetClass: string;
  x: number;
  y: number;
  sessionId: string;
}

export async function insertClicks(events: ClickEventData[]): Promise<void> {
  const sql = getSql();
  if (!sql || events.length === 0) return;
  try {
    await Promise.all(
      events.map((e) => sql`
        INSERT INTO click_events (user_token, path, target_tag, target_text, target_id, target_class, x, y, session_id)
        VALUES (${e.userToken}, ${e.path}, ${e.targetTag}, ${e.targetText.slice(0, 100)}, ${e.targetId}, ${e.targetClass.slice(0, 200)}, ${e.x}, ${e.y}, ${e.sessionId})
      `),
    );
  } catch (err) {
    console.error('Failed to insert clicks:', err);
  }
}

// ─── Analytics queries ─────────────────────────────────────────────────────────

export interface UserSummary {
  user_token: string;
  total_views: number;
  total_clicks: number;
  last_active: string;
}

export async function queryUserSummary(since?: string): Promise<UserSummary[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const sinceTs = since ?? '1970-01-01T00:00:00Z';
    const rows = await sql`
      SELECT user_token,
        SUM(views) AS total_views,
        SUM(clicks) AS total_clicks,
        MAX(last_ts) AS last_active
      FROM (
        SELECT user_token, COUNT(*) AS views, 0 AS clicks, MAX(created_at) AS last_ts
        FROM page_views WHERE created_at >= ${sinceTs}::timestamptz GROUP BY user_token
        UNION ALL
        SELECT user_token, 0 AS views, COUNT(*) AS clicks, MAX(created_at) AS last_ts
        FROM click_events WHERE created_at >= ${sinceTs}::timestamptz GROUP BY user_token
      ) combined
      GROUP BY user_token
      ORDER BY user_token
    `;
    return rows as unknown as UserSummary[];
  } catch (err) {
    console.error('queryUserSummary failed:', err);
    return [];
  }
}

export interface PagePopularity {
  path: string;
  view_count: number;
}

export async function queryPagePopularity(since?: string): Promise<PagePopularity[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const sinceTs = since ?? '1970-01-01T00:00:00Z';
    const rows = await sql`
      SELECT path, COUNT(*) AS view_count
      FROM page_views
      WHERE created_at >= ${sinceTs}::timestamptz
      GROUP BY path
      ORDER BY view_count DESC
      LIMIT 30
    `;
    return rows as unknown as PagePopularity[];
  } catch (err) {
    console.error('queryPagePopularity failed:', err);
    return [];
  }
}

export interface TopClick {
  target_text: string;
  path: string;
  click_count: number;
}

export async function queryTopClicks(since?: string): Promise<TopClick[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const sinceTs = since ?? '1970-01-01T00:00:00Z';
    const rows = await sql`
      SELECT target_text, path, COUNT(*) AS click_count
      FROM click_events
      WHERE target_text != '' AND created_at >= ${sinceTs}::timestamptz
      GROUP BY target_text, path
      ORDER BY click_count DESC
      LIMIT 30
    `;
    return rows as unknown as TopClick[];
  } catch (err) {
    console.error('queryTopClicks failed:', err);
    return [];
  }
}
