import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { fetchGoogleSheetData } from '@/utils/googleSheets';
import { InvestmentObject } from '@/types/investment-object';
import { useToast } from '@/hooks/use-toast';

interface GoogleSheetRow {
  [key: string]: string | number;
}

const mapSheetRowToObject = (row: GoogleSheetRow, index: number): InvestmentObject | null => {
  try {
    const getPropertyType = (type: string): 'apartments' | 'flats' | 'commercial' | 'country' => {
      const typeLower = type.toLowerCase();
      if (typeLower.includes('апарт')) return 'apartments';
      if (typeLower.includes('коммерч') || typeLower.includes('офис') || typeLower.includes('торгов')) return 'commercial';
      if (typeLower.includes('загород') || typeLower.includes('коттедж') || typeLower.includes('дом')) return 'country';
      return 'flats';
    };

    const parseNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      const str = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
      return parseFloat(str) || 0;
    };

    const title = String(row['Название'] || row['название'] || row['Объект'] || '').trim();
    if (!title) return null;

    return {
      id: index + 1000,
      title,
      type: getPropertyType(String(row['Тип'] || row['тип'] || '')),
      city: String(row['Город'] || row['город'] || row['Локация'] || 'Москва').trim(),
      address: String(row['Адрес'] || row['адрес'] || row['Расположение'] || '').trim(),
      price: parseNumber(row['Цена'] || row['цена'] || row['Стоимость'] || 0),
      yield: parseNumber(row['Доходность'] || row['доходность'] || row['Yield'] || 0),
      paybackPeriod: parseNumber(row['Окупаемость'] || row['окупаемость'] || row['Payback'] || 0),
      area: parseNumber(row['Площадь'] || row['площадь'] || row['Area'] || 0),
      status: 'available',
      images: [
        String(row['Изображение'] || row['изображение'] || row['Фото'] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop')
      ],
      description: String(row['Описание'] || row['описание'] || row['Description'] || title).trim(),
      brokerId: 1,
      createdAt: new Date().toISOString(),
      monthlyIncome: parseNumber(row['Месячный доход'] || row['месячный доход'] || 0),
      rentalYield: parseNumber(row['Доходность'] || row['доходность'] || 0),
    };
  } catch (error) {
    console.error('Error mapping row to object:', error, row);
    return null;
  }
};

export const GoogleSheetsImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const sheetData = await fetchGoogleSheetData();
      
      if (sheetData && sheetData.length > 0) {
        const objects = sheetData
          .map((row, index) => mapSheetRowToObject(row, index))
          .filter((obj): obj is InvestmentObject => obj !== null);
        
        if (objects.length > 0) {
          localStorage.setItem('investment-objects', JSON.stringify(objects));
          toast({
            title: "Импорт выполнен!",
            description: `Загружено ${objects.length} объектов из Google Таблицы`,
          });
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast({
            variant: "destructive",
            title: "Ошибка импорта",
            description: "Не удалось распознать данные в таблице",
          });
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка импорта",
        description: error instanceof Error ? error.message : "Не удалось загрузить данные",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleImport}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <>
          <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
          Загрузка...
        </>
      ) : (
        <>
          <Icon name="RefreshCw" className="mr-2" size={16} />
          Импорт из Google Таблицы
        </>
      )}
    </Button>
  );
};
