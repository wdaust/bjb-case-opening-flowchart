import { createContext, useContext, useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { type Session, getSavedSession, validateLogin, clearSession } from '../utils/auth';
import { APP_VERSION } from '../utils/version';

interface AuthContextValue {
  user: Session;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const session = await validateLogin(username.trim().toLowerCase(), password);
    setLoading(false);
    if (session) {
      onLogin(session);
    } else {
      setError('Invalid credentials');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          BJB Optimus
        </h1>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 14px',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: '#2a2a2a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <p style={{
            color: '#ef4444',
            fontSize: '13px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={{ color: '#666', fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
          v{APP_VERSION}
        </p>
      </form>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUser(getSavedSession());
    setChecked(true);
  }, []);

  function logout() {
    clearSession();
    setUser(null);
  }

  if (!checked) return null;

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
