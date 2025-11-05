import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { fetchGoogleSheetData } from '@/utils/googleSheets';
import { InvestmentObject, Broker } from '@/types/investment-object';
import { useToast } from '@/hooks/use-toast';

interface GoogleSheetRow {
  [key: string]: string | number;
}

const parseNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  const str = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
  return parseFloat(str) || 0;
};

const mapSheetRowToBroker = (row: GoogleSheetRow, index: number): Broker | null => {
  try {
    const name = String(row['ФИО'] || row['Имя'] || row['Брокер'] || '').trim();
    if (!name || name === 'ФИО') return null;

    return {
      id: index + 100,
      name,
      company: String(row['Компания'] || row['компания'] || 'Независимый брокер').trim(),
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      rating: 4.5,
      phone: String(row['Телефон'] || row['телефон'] || row['Контакт'] || '+7 (000) 000-00-00').trim(),
      email: String(row['Email'] || row['email'] || row['Почта'] || `${name.toLowerCase().replace(/\s+/g, '.')}@broker.ru`).trim(),
      dealsCompleted: parseNumber(row['Сделок'] || row['сделок'] || 0)
    };
  } catch (error) {
    console.error('Error mapping row to broker:', error, row);
    return null;
  }
};

const mapSheetRowToObject = (row: GoogleSheetRow, index: number, brokerId: number): InvestmentObject | null => {
  try {
    const getPropertyType = (type: string): 'apartments' | 'flats' | 'commercial' | 'country' => {
      const typeLower = type.toLowerCase();
      if (typeLower.includes('апарт')) return 'apartments';
      if (typeLower.includes('коммерч') || typeLower.includes('офис') || typeLower.includes('торгов')) return 'commercial';
      if (typeLower.includes('загород') || typeLower.includes('коттедж') || typeLower.includes('дом')) return 'country';
      return 'flats';
    };

    const title = String(row['Название объекта'] || row['Объект'] || row['Название'] || '').trim();
    if (!title || title === 'Название объекта') return null;

    return {
      id: index + 1000,
      title,
      type: getPropertyType(String(row['Тип'] || row['тип'] || 'flats')),
      city: String(row['Город'] || row['город'] || 'Москва').trim(),
      address: String(row['Адрес'] || row['адрес'] || row['Расположение'] || '').trim(),
      price: parseNumber(row['Цена'] || row['цена'] || row['Стоимость'] || 0),
      yield: parseNumber(row['Доходность %'] || row['доходность'] || row['Yield'] || 0),
      paybackPeriod: parseNumber(row['Окупаемость'] || row['окупаемость'] || 0),
      area: parseNumber(row['Площадь'] || row['площадь'] || 0),
      status: 'available',
      images: [
        String(row['Фото'] || row['Изображение'] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop')
      ],
      description: String(row['Описание'] || row['описание'] || title).trim(),
      brokerId,
      createdAt: new Date().toISOString(),
      monthlyIncome: parseNumber(row['Доход/мес'] || row['Месячный доход'] || 0),
      rentalYield: parseNumber(row['Доходность %'] || row['доходность'] || 0),
    };
  } catch (error) {
    console.error('Error mapping row to object:', error, row);
    return null;
  }
};

const parseCSV = (text: string): GoogleSheetRow[] => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: GoogleSheetRow = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
};

export const GoogleSheetsImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processData = (sheetData: GoogleSheetRow[]) => {
      
    console.log('Получено строк:', sheetData.length);
    console.log('Все заголовки колонок:', Object.keys(sheetData[0] || {}));
    console.log('Первые 3 строки:', sheetData.slice(0, 3));
    
    if (sheetData && sheetData.length > 0) {
      const brokers = sheetData
        .map((row, index) => mapSheetRowToBroker(row, index))
        .filter((broker): broker is Broker => broker !== null);
      
      console.log('Распознано брокеров:', brokers.length);
      
      const allObjects: InvestmentObject[] = [];
        
      brokers.forEach((broker) => {
        const brokerRow = sheetData.find(row => 
          String(row['ФИО'] || '').trim() === broker.name
        );
        
        if (brokerRow) {
          for (let i = 1; i <= 10; i++) {
            const objectData: GoogleSheetRow = {};
            const colPrefix = `Объект ${i}`;
            
            objectData['Название объекта'] = brokerRow[`${colPrefix} название`] || '';
            objectData['Тип'] = brokerRow[`${colPrefix} тип`] || '';
            objectData['Город'] = brokerRow[`${colPrefix} город`] || '';
            objectData['Адрес'] = brokerRow[`${colPrefix} адрес`] || '';
            objectData['Цена'] = brokerRow[`${colPrefix} цена`] || 0;
            objectData['Площадь'] = brokerRow[`${colPrefix} площадь`] || 0;
            objectData['Доходность %'] = brokerRow[`${colPrefix} доходность`] || 0;
            objectData['Доход/мес'] = brokerRow[`${colPrefix} доход/мес`] || 0;
            objectData['Фото'] = brokerRow[`${colPrefix} фото`] || '';
            
            const obj = mapSheetRowToObject(objectData, allObjects.length, broker.id);
            if (obj) {
              allObjects.push(obj);
            }
          }
        }
      });
      
      console.log('Распознано объектов:', allObjects.length);
      
      if (brokers.length > 0) {
        localStorage.setItem('investment-brokers', JSON.stringify(brokers));
      }
      
      if (allObjects.length > 0) {
        localStorage.setItem('investment-objects', JSON.stringify(allObjects));
      }
      
      toast({
        title: "Импорт выполнен!",
        description: `Загружено ${brokers.length} брокеров и ${allObjects.length} объектов`,
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const sheetData = parseCSV(text);
        processData(sheetData);
      } catch (error) {
        console.error('File parse error:', error);
        toast({
          variant: "destructive",
          title: "Ошибка чтения файла",
          description: "Проверьте формат CSV файла",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const handleGoogleSync = async () => {
    setIsLoading(true);
    try {
      const sheetData = await fetchGoogleSheetData();
      processData(sheetData);
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка синхронизации",
        description: "Не удалось загрузить данные из Google Таблицы",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleGoogleSync}
        disabled={isLoading}
        variant="default"
        size="sm"
      >
        {isLoading ? (
          <>
            <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
            Синхронизация...
          </>
        ) : (
          <>
            <Icon name="RefreshCw" className="mr-2" size={16} />
            Синхронизация с Google
          </>
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        <Icon name="Upload" className="mr-2" size={16} />
        Загрузить CSV
      </Button>
    </div>
  );
};