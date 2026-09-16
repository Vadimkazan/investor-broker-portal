import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyRole } from '@/utils/roles';

const AUTH_URL = 'https://functions.poehali.dev/6b7dd561-5529-4cdd-b4f7-72c236e9e68f';

const TelegramCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { loginWithUserId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (!token) {
      setError('Ссылка недействительна — отсутствует токен');
      return;
    }
    handledRef.current = true;

    (async () => {
      try {
        const res = await fetch(`${AUTH_URL}?action=callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!res.ok || !data.user?.id) {
          setError(data.error || 'Не удалось войти через Telegram. Попробуйте ещё раз.');
          return;
        }

        const dbUser = await loginWithUserId(data.user.id);
        if (hasAnyRole(dbUser, ['admin', 'manager'])) {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } catch {
        setError('Произошла сетевая ошибка. Попробуйте ещё раз.');
      }
    })();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-semibold mb-2">Ошибка входа</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button className="text-primary underline" onClick={() => navigate('/')}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Icon name="Loader2" size={48} className="mx-auto text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Выполняется вход через Telegram...</p>
      </div>
    </div>
  );
};

export default TelegramCallbackPage;
