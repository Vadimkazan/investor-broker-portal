import json
import os
import psycopg2
import urllib.request
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Import objects from Google Sheets to database
    Args: event with httpMethod, queryStringParameters
    Returns: HTTP response with import results
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return error_response('Method not allowed', 405)
    
    conn = None
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        user_id = event.get('headers', {}).get('x-user-id')
        if not user_id:
            return error_response('Authentication required', 401)
        
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (int(user_id),))
        user_row = cur.fetchone()
        
        if not user_row or not user_row[0]:
            return error_response('Admin access required', 403)
        
        SHEET_ID = '1jnOO6dUJ6z903U1IVd8eZRJR7l-gn_62oJ9y-sQUnaU'
        csv_url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2%20Юрий%20Морозкин'
        
        with urllib.request.urlopen(csv_url) as response:
            csv_text = response.read().decode('utf-8')
        
        rows = parse_csv(csv_text)
        
        if not rows:
            return error_response('No data found in Google Sheet', 400)
        
        cur.execute("DELETE FROM investment_objects WHERE broker_id = 2")
        deleted_count = cur.rowcount
        
        imported_count = 0
        for row in rows:
            obj = map_row_to_object(row, int(user_id))
            if obj:
                try:
                    cur.execute("""
                        INSERT INTO investment_objects 
                        (broker_id, title, city, address, property_type, area, price, 
                         yield_percent, payback_years, description, images, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        obj['broker_id'], obj['title'], obj['city'], obj['address'],
                        obj['property_type'], obj['area'], obj['price'], 
                        obj['yield_percent'], obj['payback_years'], obj['description'],
                        obj['images'], obj['status']
                    ))
                    imported_count += 1
                except Exception as e:
                    print(f"Error importing object: {e}, row: {row}")
        
        conn.commit()
        
        return success_response({
            'message': 'Import successful',
            'deleted': deleted_count,
            'imported': imported_count
        })
    
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(f'Import failed: {str(e)}', 500)
    
    finally:
        if conn:
            conn.close()


def parse_csv(csv_text: str) -> List[Dict[str, str]]:
    lines = [line for line in csv_text.split('\n') if line.strip()]
    if not lines:
        return []
    
    headers = parse_csv_line(lines[0])
    rows = []
    
    for i in range(1, len(lines)):
        values = parse_csv_line(lines[i])
        row = {}
        for j, header in enumerate(headers):
            row[header] = values[j].strip() if j < len(values) else ''
        rows.append(row)
    
    return rows


def parse_csv_line(line: str) -> List[str]:
    result = []
    current = ''
    in_quotes = False
    
    i = 0
    while i < len(line):
        char = line[i]
        
        if char == '"':
            if in_quotes and i + 1 < len(line) and line[i + 1] == '"':
                current += '"'
                i += 1
            else:
                in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            result.append(current)
            current = ''
        else:
            current += char
        
        i += 1
    
    result.append(current)
    return result


def map_row_to_object(row: Dict[str, str], broker_id: int) -> Dict[str, Any]:
    def get_property_type(type_str: str) -> str:
        type_lower = type_str.lower()
        if 'апарт' in type_lower:
            return 'apartments'
        if 'коммерч' in type_lower or 'офис' in type_lower or 'торгов' in type_lower:
            return 'commercial'
        if 'загород' in type_lower or 'коттедж' in type_lower or 'дом' in type_lower:
            return 'country'
        return 'flats'
    
    def parse_number(value: str) -> float:
        if not value:
            return 0.0
        cleaned = ''.join(c for c in str(value) if c.isdigit() or c in '.,')
        cleaned = cleaned.replace(',', '.')
        try:
            return float(cleaned)
        except:
            return 0.0
    
    title = (row.get('Название') or row.get('название') or row.get('Объект') or '').strip()
    if not title:
        return None
    
    return {
        'broker_id': broker_id,
        'title': title,
        'property_type': get_property_type(row.get('Тип') or row.get('тип') or ''),
        'city': (row.get('Город') or row.get('город') or row.get('Локация') or 'Москва').strip(),
        'address': (row.get('Адрес') or row.get('адрес') or row.get('Расположение') or '').strip(),
        'price': parse_number(row.get('Цена') or row.get('цена') or row.get('Стоимость') or '0'),
        'yield_percent': parse_number(row.get('Доходность') or row.get('доходность') or row.get('Yield') or '0'),
        'payback_years': parse_number(row.get('Окупаемость') or row.get('окупаемость') or row.get('Payback') or '0'),
        'area': parse_number(row.get('Площадь') or row.get('площадь') or row.get('Area') or '0'),
        'description': (row.get('Описание') or row.get('описание') or row.get('Description') or title).strip(),
        'images': [row.get('Изображение') or row.get('изображение') or row.get('Фото') or 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'],
        'status': 'available'
    }


def success_response(data: Any, status: int = 200) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False),
        'isBase64Encoded': False
    }


def error_response(message: str, status: int) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}, ensure_ascii=False),
        'isBase64Encoded': False
    }
