import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const SHEET_ID = '1jnOO6dUJ6z903U1IVd8eZRJR7l-gn_62oJ9y-sQUnaU';
const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа
const API_URL = 'https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973';

const SHEET_NAMES = [
  '2 Юрий Морозкин',
  'Лист1',
  'Sheet1',
  'Объекты',
  'Data'
];

interface SheetObject {
  [key: string]: string;
}

const GoogleSheetsSync = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const { toast } = useToast();

  const notifySubscribedUsers = async (newObject: any) => {
    try {
      const usersResponse = await fetch(`${API_URL}?resource=users`);
      if (!usersResponse.ok) return;
      
      const users = await usersResponse.json();
      const subscribedUsers = users.filter((u: any) => u.notify_new_objects && u.role === 'investor');
      
      for (const user of subscribedUsers) {
        const notificationData = {
          user_id: user.id,
          type: 'new_object',
          title: 'Новый объект на платформе',
          message: `Добавлен новый объект: ${newObject.title} в ${newObject.city}. Доходность: ${newObject.yield_percent}%`,
          object_id: newObject.id
        };
        
        const notifUrl = `${API_URL}?resource=notifications`;
        await fetch(notifUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationData)
        });

        if (user.telegram_chat_id) {
          const telegramMessage = `🏢 <b>Новый объект!</b>\n\n` +
            `📍 ${newObject.title}\n` +
            `🏙 ${newObject.city}\n` +
            `📊 Доходность: ${newObject.yield_percent}%\n\n` +
            `Посмотреть на платформе →`;

          const TELEGRAM_FUNCTION_URL = 'https://functions.poehali.dev/416cd867-831b-48d3-b4a7-5c17b62c7e19';
          
          await fetch(TELEGRAM_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.telegram_chat_id,
              message: telegramMessage,
              parse_mode: 'HTML'
            })
          }).catch(err => console.error('Telegram error:', err));
        }
      }
    } catch (error) {
      console.error('Ошибка отправки уведомлений:', error);
    }
  };

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

      if (timeSinceLastSync >= SYNC_INTERVAL) {
        await syncFromGoogleSheets();
      }
    };

    checkAndSync();
    const interval = setInterval(checkAndSync, 60 * 60 * 1000); // Проверка каждый час

    return () => clearInterval(interval);
  }, [autoSyncEnabled]);

  const parseCSV = (text: string): SheetObject[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }

      result.push(current);
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: SheetObject[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.trim().replace(/^"|"$/g, ''));
      const row: SheetObject = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row);
    }

    return rows;
  };

  const fetchSheetData = async (sheetName: string): Promise<SheetObject[]> => {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки листа "${sheetName}": ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  };

  const syncFromGoogleSheets = async () => {
    try {
      setLoading(true);
      setProgress(5);
      setStatus('Подключение к Google Таблице...');

      let allData: SheetObject[] = [];
      let successfulSheets = 0;

      for (let i = 0; i < SHEET_NAMES.length; i++) {
        const sheetName = SHEET_NAMES[i];
        try {
          setStatus(`Загрузка листа "${sheetName}"...`);
          setProgress(5 + (i / SHEET_NAMES.length) * 20);

          const sheetData = await fetchSheetData(sheetName);
          
          if (sheetData.length > 0) {
            const firstRow = sheetData[0];
            const hasRelevantColumns = 
              Object.keys(firstRow).some(key => 
                key.toLowerCase().includes('название') || 
                key.toLowerCase().includes('объект') ||
                key.toLowerCase().includes('title')
              );

            if (hasRelevantColumns) {
              allData = [...allData, ...sheetData];
              successfulSheets++;
              console.log(`Загружен лист "${sheetName}": ${sheetData.length} строк`);
            }
          }
        } catch (err) {
          console.log(`Не удалось загрузить лист "${sheetName}":`, err);
        }
      }

      if (allData.length === 0) {
        throw new Error('Не найдено данных ни в одном из листов');
      }

      setProgress(30);
      setStatus(`Обработка ${allData.length} объектов из ${successfulSheets} листов...`);

      console.log('Всего строк для обработки:', allData.length);
      console.log('Заголовки:', Object.keys(allData[0] || {}));

      const parseNumber = (value: string): number => {
        if (!value) return 0;
        const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
      };

      const getPropertyType = (type: string): 'flats' | 'apartments' | 'commercial' | 'country' => {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('апарт')) return 'apartments';
        if (typeLower.includes('коммерч') || typeLower.includes('офис')) return 'commercial';
        if (typeLower.includes('загород') || typeLower.includes('коттедж')) return 'country';
        return 'flats';
      };

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];

        const title = row['Название объекта'] || row['Объект'] || row['Название'] || row['Title'];
        if (!title || title === 'Название объекта' || title.length < 3) continue;

        try {
          const objectData = {
            broker_id: 2,
            title,
            city: row['Город'] || row['город'] || row['City'] || 'Москва',
            address: row['Адрес'] || row['адрес'] || row['Расположение'] || row['Address'] || '',
            property_type: getPropertyType(row['Тип'] || row['тип'] || row['Type'] || 'flats'),
            area: parseNumber(row['Площадь'] || row['площадь'] || row['Area'] || '0'),
            price: parseNumber(row['Цена'] || row['цена'] || row['Стоимость'] || row['Price'] || '0'),
            yield_percent: parseNumber(row['Доходность %'] || row['доходность'] || row['Yield'] || '0'),
            payback_years: parseNumber(row['Окупаемость'] || row['окупаемость'] || row['Payback'] || '0'),
            description: row['Описание'] || row['описание'] || row['Description'] || title,
            images: row['Фото'] ? [row['Фото']] : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'],
            status: 'available' as const,
          };

          if (objectData.price === 0 || objectData.area === 0) {
            console.log(`Пропущен объект "${title}" - отсутствуют обязательные данные`);
            continue;
          }

          const queryParams = new URLSearchParams({ resource: 'objects' });
          const url = `${API_URL}?${queryParams}`;

          const apiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objectData),
          });

          if (apiResponse.ok) {
            successCount++;
            const newObject = await apiResponse.json();
            await notifySubscribedUsers(newObject);
          } else {
            console.error(`Ошибка создания объекта "${title}":`, await apiResponse.text());
            errorCount++;
          }

          setProgress(30 + (i / allData.length) * 65);
        } catch (err) {
          console.error(`Ошибка обработки строки ${i}:`, err);
          errorCount++;
        }
      }

      setProgress(100);
      setStatus('Синхронизация завершена!');

      const now = new Date();
      localStorage.setItem('lastGoogleSheetsSync', now.toISOString());
      setLastSync(now);

      toast({
        title: 'Синхронизация выполнена',
        description: `Загружено из ${successfulSheets} листов. Успешно: ${successCount}, Ошибок: ${errorCount}`,
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      toast({
        title: 'Ошибка синхронизации',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
      setStatus('Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('autoSyncEnabled', newValue.toString());
    
    toast({
      title: newValue ? 'Автосинхронизация включена' : 'Автосинхронизация выключена',
      description: newValue ? 'Данные будут обновляться каждые 24 часа' : 'Автоматическое обновление отключено',
    });
  };

  const getTimeSinceLastSync = () => {
    if (!lastSync) return 'Никогда';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} мин. назад`;
    }
    return `${hours} ч. ${minutes} мин. назад`;
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Загрузить объекты из всех листов таблицы
          </p>
          {lastSync && (
            <Badge variant="outline" className="text-xs">
              <Icon name="Clock" size={12} className="mr-1" />
              {getTimeSinceLastSync()}
            </Badge>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={syncFromGoogleSheets}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                Синхронизация...
              </>
            ) : (
              <>
                <Icon name="Download" className="mr-2" size={16} />
                Синхронизировать
              </>
            )}
          </Button>

          <Button
            onClick={toggleAutoSync}
            disabled={loading}
            variant={autoSyncEnabled ? 'default' : 'outline'}
          >
            <Icon name={autoSyncEnabled ? 'Check' : 'Clock'} size={16} className="mr-2" />
            Авто (24ч)
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>📋 Ищет данные во всех листах таблицы</p>
          <p>🔄 {autoSyncEnabled ? 'Автообновление: включено (каждые 24 часа)' : 'Автообновление: выключено'}</p>
          <p>💾 Данные сохраняются в PostgreSQL</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsSync;