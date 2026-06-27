import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/services/api';

const AUTH_URL = 'https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973?resource=auth';

async function authRequest(body: Record<string, unknown>): Promise<User> {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');
  return data as User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, role: 'investor' | 'broker') => Promise<User>;
  logout: () => void;
  switchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('investpro-user');
    if (saved) {
      try {
        const userData = JSON.parse(saved) as User;
        setUser(userData);
        // Фоново синхронизируем с БД
        setSyncing(true);
        api.getUserByEmail(userData.email)
          .then(dbUser => {
            setUser(dbUser);
            localStorage.setItem('investpro-user', JSON.stringify(dbUser));
          })
          .catch(() => {})
          .finally(() => setTimeout(() => setSyncing(false), 500));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const dbUser = await authRequest({ action: 'login', email, password });
    setUser(dbUser);
    localStorage.setItem('investpro-user', JSON.stringify(dbUser));
    return dbUser;
  };

  const register = async (email: string, password: string, name: string, role: 'investor' | 'broker'): Promise<User> => {
    const dbUser = await authRequest({ action: 'register', email, password, name, role });
    setUser(dbUser);
    localStorage.setItem('investpro-user', JSON.stringify(dbUser));
    return dbUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('investpro-user');
  };

  const switchRole = async () => {
    if (!user) return;
    const newRole = user.role === 'broker' ? 'investor' : 'broker';
    const updated = { ...user, role: newRole };
    setUser(updated as User);
    localStorage.setItem('investpro-user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, syncing, login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};
