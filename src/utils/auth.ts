const STORAGE_KEY = 'bjb-auth';

/** SHA-256 hex → user token */
const PASSWORD_HASHES: Record<string, string> = {
  '2b486cc3f39a4b1cd0c52f6184525a56f08fd9b89e8391b12223b66c079d54ce': 'user-1',
  '5826745885afee723fbd39e235fcdd3300ce7d674a9a887ba33723f1d9e42cc2': 'user-2',
  '16f86ea86f8aabc8b782e6fd286ece7980c5d107a59ec3e5d81b520dc71666ca': 'user-3',
  'ea02b0f8a029134a0b689ba1c1244d29e2669224233437f1c34f818f7e706eda': 'user-4',
  'fc1cffed5860b78fb73d0a8b2b93c26ad2a32e8f9104686bf4968ff1706c0e2c': 'user-5',
  'a9c0ac5f838e69b93e3b8cb2592865f881b14cd6cd21ea8130bc5fbc1eec48b8': 'user-6',
  '3e7bff9af3c7f5d36c0d07a3a0ec3fdc0a32526c72acb8683732b4f8e4be6b0a': 'user-7',
  'fa6e501dec9b0eb1a84e83ec93ea4b1bfa4e530811d4997f08ca9611e38bf9f0': 'user-8',
  '7001a43dc7e223c1ef318c775f6308e136efcd6f090a7e4758f92d35b38a4c08': 'user-9',
  '7bfa7c82af28e822e662aa0af3305bfc182860dcd7c8cd4d4853ad3adf9f7f37': 'user-10',
};

export async function hashPassword(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function validatePassword(plain: string): Promise<string | null> {
  const hash = await hashPassword(plain);
  return PASSWORD_HASHES[hash] ?? null;
}

export function getSavedToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch { /* ignore */ }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
