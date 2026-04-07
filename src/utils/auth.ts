import { initDb, loadGenericSection } from './db.ts';
import type { MosContributorsData } from '../types/mos.ts';

export interface User {
  username: string;
  displayName: string;
  role: string;
  passwordHash: string;
}

export interface Session {
  username: string;
  displayName: string;
  role: string;
}

const SESSION_KEY = 'optimus_session';

// SHA-256 hash of "Optimus2026!"
const PASSWORD_HASH = '601b1120eb22dbfa031ce5706e512d329becc8aa6ca4b037d7bbceab01c5a02e';

const users: User[] = [
  { username: 'mbroderick', displayName: 'Matthew Broderick', role: 'admin', passwordHash: PASSWORD_HASH },
  { username: 'wdaust', displayName: 'Will Daust', role: 'admin', passwordHash: PASSWORD_HASH },
  { username: 'jbillingsley', displayName: 'Justin Billingsley', role: 'admin', passwordHash: PASSWORD_HASH },
  { username: 'kdelgado', displayName: 'Kennia Delgado', role: 'admin', passwordHash: PASSWORD_HASH },
];

export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function validateLogin(username: string, password: string): Promise<Session | null> {
  const hash = await hashPassword(password);

  // Check hardcoded admin users first
  const user = users.find((u) => u.username === username && u.passwordHash === hash);
  if (user) {
    const session: Session = { username: user.username, displayName: user.displayName, role: user.role };
    saveSession(session);
    return session;
  }

  // Check DB-stored contributors
  try {
    await initDb();
    const data = await loadGenericSection<MosContributorsData>('mos-contributors');
    if (data?.contributors) {
      const contributor = data.contributors.find(
        (c) => c.active && c.username === username && c.passwordHash === hash
      );
      if (contributor) {
        const session: Session = {
          username: contributor.username,
          displayName: contributor.displayName,
          role: 'contributor',
        };
        saveSession(session);
        return session;
      }
    }
  } catch (err) {
    console.error('Failed to check contributors:', err);
  }

  return null;
}

export function getSavedSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
