import { neon } from '@neondatabase/serverless';

interface SfToken {
  access_token: string;
  instance_url: string;
  issued_at: number;
}

let memoryCache: SfToken | null = null;

function getSql() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

async function ensureTokenTable() {
  const sql = getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS sf_token_cache (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      access_token TEXT NOT NULL,
      instance_url TEXT NOT NULL,
      issued_at BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}

async function getCachedToken(): Promise<SfToken | null> {
  if (memoryCache && !isExpired(memoryCache)) return memoryCache;

  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = await sql`SELECT access_token, instance_url, issued_at FROM sf_token_cache WHERE id = 'singleton'`;
    if (rows.length === 0) return null;
    const token = { access_token: rows[0].access_token as string, instance_url: rows[0].instance_url as string, issued_at: Number(rows[0].issued_at) };
    if (isExpired(token)) return null;
    memoryCache = token;
    return token;
  } catch {
    return null;
  }
}

async function cacheToken(token: SfToken) {
  memoryCache = token;
  const sql = getSql();
  if (!sql) return;

  await sql`
    INSERT INTO sf_token_cache (id, access_token, instance_url, issued_at)
    VALUES ('singleton', ${token.access_token}, ${token.instance_url}, ${token.issued_at})
    ON CONFLICT (id) DO UPDATE SET
      access_token = ${token.access_token},
      instance_url = ${token.instance_url},
      issued_at = ${token.issued_at},
      created_at = now()
  `;
}

function isExpired(token: SfToken): boolean {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const ONE_HOUR = 60 * 60 * 1000;
  const age = Date.now() - token.issued_at;
  return age >= ONE_HOUR - FIVE_MINUTES;
}

async function authenticate(): Promise<SfToken> {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: process.env.SF_CLIENT_ID!,
    client_secret: process.env.SF_CLIENT_SECRET!,
    username: process.env.SF_USERNAME!,
    password: process.env.SF_PASSWORD!,
  });

  const res = await fetch(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Salesforce auth failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { access_token: string; instance_url: string; issued_at: string };
  return {
    access_token: data.access_token,
    instance_url: data.instance_url,
    issued_at: parseInt(data.issued_at, 10),
  };
}

let initialized = false;

export async function getSfToken(): Promise<SfToken> {
  if (!initialized) {
    await ensureTokenTable();
    initialized = true;
  }

  const cached = await getCachedToken();
  if (cached) return cached;

  const token = await authenticate();
  await cacheToken(token);
  return token;
}

export async function sfFetch(path: string): Promise<unknown> {
  const token = await getSfToken();
  const res = await fetch(`${token.instance_url}${path}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Salesforce API error (${res.status}): ${body}`);
  }
  return res.json();
}
