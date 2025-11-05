export interface GoogleSheetRow {
  [key: string]: string | number;
}

export interface BrokerData {
  name: string;
  company: string;
  phone: string;
  email: string;
}

const PUBLISHED_SHEET_ID = '2PACX-1vTEeN8iRaVIy-nQ62ylGv0CWuz5PiFV8wkN_13gmEb1oLG-v30aJSHsKDphfzLEUxu-bZ7gY_0r3AR4';

export async function fetchGoogleSheetData(): Promise<GoogleSheetRow[]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_SHEET_ID}/pub?output=csv`;
  
  try {
    console.log('Синхронизация с Google Таблицей...');
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const parsed = parseCSV(csvText);
    console.log('Загружено строк:', parsed.length);
    
    if (parsed.length > 0) {
      console.log('Колонки:', Object.keys(parsed[0]));
      console.log('Первая строка данных:', parsed[0]);
    }
    
    return parsed;
  } catch (error) {
    console.error('Ошибка синхронизации с Google Таблицей:', error);
    throw error;
  }
}

function parseCSV(csv: string): GoogleSheetRow[] {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows: GoogleSheetRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: GoogleSheetRow = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      row[header] = value;
    });
    
    rows.push(row);
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
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
}