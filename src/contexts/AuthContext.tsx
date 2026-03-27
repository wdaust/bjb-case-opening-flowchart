import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode, FormEvent } from 'react';
import { validatePassword, getSavedToken, saveToken, clearToken } from '../utils/auth.ts';

interface AuthContextValue {
  userToken: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({ userToken: null, logout: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = getSavedToken();
    if (saved) setUserToken(saved);
    setChecked(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUserToken(null);
  }, []);

  const handleLogin = useCallback((token: string) => {
    saveToken(token);
    setUserToken(token);
  }, []);

  if (!checked) return null;

  if (!userToken) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={{ userToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = await validatePassword(password.trim());
    setLoading(false);
    if (token) {
      onLogin(token);
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#111111]"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 bg-black border border-[#2a2a2a] rounded-xl"
      >
        <h1 className="text-white text-lg font-semibold mb-6 text-center">BJB Dashboard</h1>
        <label className="block text-gray-400 text-sm mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#555] placeholder-gray-600"
          placeholder="Enter access password"
        />
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="mt-4 w-full py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  );
}
