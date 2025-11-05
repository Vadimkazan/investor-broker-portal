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
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    throw error;
  }
}

export async function fetchGoogleSheetData(): Promise<GoogleSheetRow[]> {
  return fetchBrokersFromSheet('2 Юрий Морозкин');
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