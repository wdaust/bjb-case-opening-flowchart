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
const PASSWORD_HASH = '2c42b74e178462990ff4e4944c5f2088b6eb243158551dd0fdd597f94f6f7168';

const users: User[] = [
  { username: 'mbroderick', displayName: 'Matthew Broderick', role: 'admin', passwordHash: PASSWORD_HASH },
  { username: 'wdaust', displayName: 'Will Daust', role: 'admin', passwordHash: PASSWORD_HASH },
  { username: 'jbillingsley', displayName: 'Justin Billingsley', role: 'admin', passwordHash: PASSWORD_HASH },
];

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function validateLogin(username: string, password: string): Promise<Session | null> {
  const hash = await hashPassword(password);
  const user = users.find((u) => u.username === username && u.passwordHash === hash);
  if (!user) return null;
  const session: Session = { username: user.username, displayName: user.displayName, role: user.role };
  saveSession(session);
  return session;
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
