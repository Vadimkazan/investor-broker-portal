import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const IMPORT_FUNCTION_URL = 'https://functions.poehali.dev/e865a471-57fb-43e5-a1fb-3f259c247580';

const GoogleSheetsSync = () => {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const savedLastSync = localStorage.getItem('lastGoogleSheetsSync');
    if (savedLastSync) {
      setLastSync(new Date(savedLastSync));
    }

    const savedAutoSync = localStorage.getItem('autoSyncEnabled');
    if (savedAutoSync === 'true') {
      setAutoSyncEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!autoSyncEnabled) return;

    const checkAndSync = async () => {
      const savedLastSync = localStorage.getItem('lastGoogleSheetsSync');
      if (!savedLastSync) {
        await syncFromGoogleSheets();
        return;
      }

      const lastSyncDate = new Date(savedLastSync);
      const now = new Date();
      const timeSinceLastSync = now.getTime() - lastSyncDate.getTime();
      const SYNC_INTERVAL = 24 * 60 * 60 * 1000;

      if (timeSinceLastSync >= SYNC_INTERVAL) {
        await syncFromGoogleSheets();
      }
    };

    checkAndSync();
    const interval = setInterval(checkAndSync, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled]);

  const syncFromGoogleSheets = async () => {
    if (!user?.id) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо войти в систему',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(IMPORT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      const now = new Date();
      setLastSync(now);
      localStorage.setItem('lastGoogleSheetsSync', now.toISOString());

      toast({
        title: 'Синхронизация завершена',
        description: `Удалено: ${result.total_deleted}, Импортировано: ${result.total_imported} объектов`,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Ошибка синхронизации',
        description: error instanceof Error ? error.message : 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('autoSyncEnabled', String(newValue));

    toast({
      title: newValue ? 'Автосинхронизация включена' : 'Автосинхронизация отключена',
      description: newValue ? 'Данные будут обновляться каждые 24 часа' : 'Синхронизация только вручную'
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="RefreshCw" size={20} />
          Синхронизация с Google Таблицей
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Загрузить объекты из всех листов таблицы
        </div>

        {lastSync && (
          <div className="flex items-center gap-2 text-sm">
            <Icon name="Clock" size={14} />
            <span>Последняя синхронизация: {formatDate(lastSync)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="FileSpreadsheet" size={16} className="text-muted-foreground" />
            <span className="text-sm">Автообновление (24ч)</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAutoSync}
          >
            {autoSyncEnabled ? (
              <>
                <Icon name="Check" size={14} className="mr-1" />
                Авто (24ч)
              </>
            ) : (
              <>
                <Icon name="X" size={14} className="mr-1" />
                Нет
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="w-full justify-start gap-2">
            <Icon name="CheckCircle2" size={14} />
            Идет данные во всех листах таблицы
          </Badge>
          <Badge variant="outline" className="w-full justify-start gap-2">
            <Icon name="Clock" size={14} />
            Автообновление в фоновом режиме (каждые 24 часа)
          </Badge>
          <Badge variant="outline" className="w-full justify-start gap-2">
            <Icon name="Database" size={14} />
            Данные сохраняются в PostgreSQL
          </Badge>
        </div>

        <Button
          onClick={syncFromGoogleSheets}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
              Синхронизируем...
            </>
          ) : (
            <>
              <Icon name="Download" className="mr-2" size={16} />
              Синхронизировать
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsSync;
