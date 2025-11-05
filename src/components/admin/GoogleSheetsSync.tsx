import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const SHEET_ID = '1jnOO6dUJ6z903U1IVd8eZRJR7l-gn_62oJ9y-sQUnaU';

interface SheetObject {
  [key: string]: string;
}

const GoogleSheetsSync = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const { toast } = useToast();

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

  const syncFromGoogleSheets = async () => {
    try {
      setLoading(true);
      setProgress(10);
      setStatus('Подключение к Google Таблице...');

      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2%20Юрий%20Морозкин`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.statusText}`);
      }

      setProgress(30);
      setStatus('Парсинг данных...');

      const csvText = await response.text();
      const data = parseCSV(csvText);

      console.log('Заголовки:', Object.keys(data[0] || {}));
      console.log('Всего строк:', data.length);
      console.log('Первая строка:', data[0]);

      setProgress(50);
      setStatus(`Обработка ${data.length} объектов...`);

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

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const title = row['Название объекта'] || row['Объект'] || row['Название'];
        if (!title || title === 'Название объекта') continue;

        try {
          const objectData = {
            broker_id: 2,
            title,
            city: row['Город'] || row['город'] || 'Москва',
            address: row['Адрес'] || row['адрес'] || row['Расположение'] || '',
            property_type: getPropertyType(row['Тип'] || row['тип'] || 'flats'),
            area: parseNumber(row['Площадь'] || row['площадь'] || '0'),
            price: parseNumber(row['Цена'] || row['цена'] || row['Стоимость'] || '0'),
            yield_percent: parseNumber(row['Доходность %'] || row['доходность'] || row['Yield'] || '0'),
            payback_years: parseNumber(row['Окупаемость'] || row['окупаемость'] || '0'),
            description: row['Описание'] || row['описание'] || title,
            images: row['Фото'] ? [row['Фото']] : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'],
            status: 'available' as const,
          };

          const API_URL = 'https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973';
          const queryParams = new URLSearchParams({ resource: 'objects' });
          const url = `${API_URL}?${queryParams}`;

          const apiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objectData),
          });

          if (apiResponse.ok) {
            successCount++;
          } else {
            console.error(`Ошибка создания объекта "${title}":`, await apiResponse.text());
            errorCount++;
          }

          setProgress(50 + (i / data.length) * 45);
        } catch (err) {
          console.error(`Ошибка обработки строки ${i}:`, err);
          errorCount++;
        }
      }

      setProgress(100);
      setStatus('Синхронизация завершена!');

      toast({
        title: 'Синхронизация выполнена',
        description: `Успешно: ${successCount}, Ошибок: ${errorCount}`,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="RefreshCw" size={20} />
          Синхронизация с Google Таблицей
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Загрузить объекты из Google Таблицы в базу данных
        </p>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        )}

        <Button
          onClick={syncFromGoogleSheets}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
              Синхронизация...
            </>
          ) : (
            <>
              <Icon name="Download" className="mr-2" size={16} />
              Синхронизировать данные
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Источник: Лист "2 Юрий Морозкин" в Google Таблице
        </p>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsSync;
