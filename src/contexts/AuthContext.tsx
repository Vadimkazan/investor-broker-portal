import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, name: string, role: 'investor' | 'broker') => Promise<void>;
  logout: () => void;
  switchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    
    const interval = setInterval(() => {
      const savedUser = localStorage.getItem('investpro-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        api.getUserByEmail(userData.email)
          .then(dbUser => {
            setUser(dbUser);
            localStorage.setItem('investpro-user', JSON.stringify(dbUser));
          })
          .catch(() => {});
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = localStorage.getItem('investpro-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        try {
          const dbUser = await api.getUserByEmail(userData.email);
          setUser(dbUser);
          localStorage.setItem('investpro-user', JSON.stringify(dbUser));
        } catch (err) {
          console.log('User not in DB yet, keeping local data');
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, name: string, role: 'investor' | 'broker') => {
    try {
      setLoading(true);
      
      try {
        const existingUser = await api.getUserByEmail(email);
        setUser(existingUser);
        localStorage.setItem('investpro-user', JSON.stringify(existingUser));
      } catch (err) {
        const newUser = await api.createUser({ email, name, role });
        setUser(newUser);
        localStorage.setItem('investpro-user', JSON.stringify(newUser));
      }
    } catch (err) {
      console.error('Failed to login:', err);
      
      const localUser = { id: Date.now(), email, name, role, created_at: new Date().toISOString() };
      setUser(localUser);
      localStorage.setItem('investpro-user', JSON.stringify(localUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('investpro-user');
  };

  const switchRole = async () => {
    if (!user) return;
    
    const newRole = user.role === 'broker' ? 'investor' : 'broker';
    const updatedUser = { ...user, role: newRole };
    
    setUser(updatedUser as User);
    localStorage.setItem('investpro-user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};