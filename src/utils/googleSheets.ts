export interface GoogleSheetRow {
  [key: string]: string | number;
}

export interface BrokerData {
  name: string;
  company: string;
  phone: string;
  email: string;
}

const SHEET_ID = '1jnOO6dUJ6z903U1IVd8eZRJR7l-gn_62oJ9y-sQUnaU';

export async function fetchBrokersFromSheet(sheetName: string): Promise<GoogleSheetRow[]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  try {
    console.log('Fetching from URL:', csvUrl);
    console.log('Sheet name:', sheetName);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      console.error('Failed to fetch:', response.status, response.statusText);
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV first 500 chars:', csvText.substring(0, 500));
    const parsed = parseCSV(csvText);
    console.log('Parsed rows:', parsed.length);
    if (parsed.length > 0) {
      console.log('First row keys:', Object.keys(parsed[0]));
      console.log('First row:', parsed[0]);
    }
    return parsed;
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    throw error;
  }
}

export async function fetchGoogleSheetData(): Promise<GoogleSheetRow[]> {
  const sheetNames = [
    '2 Юрий Морозкин',
    '2 Юрий Морозкин ',
    'Юрий Морозкин',
    'List2',
    'Sheet2'
  ];
  
  for (const name of sheetNames) {
    try {
      console.log(`Trying sheet name: "${name}"`);
      const data = await fetchBrokersFromSheet(name);
      if (data && data.length > 0) {
        const firstRow = data[0];
        if (firstRow['ФИО'] || firstRow['FIO'] || firstRow['Имя'] || Object.keys(firstRow).some(k => k.includes('ФИО'))) {
          console.log('Found correct sheet!');
          return data;
        }
      }
    } catch (e) {
      console.log(`Failed to load sheet "${name}"`);
    }
  }
  
  console.warn('Could not find broker sheet, loading first sheet');
  return fetchBrokersFromSheet('Sheet1');
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