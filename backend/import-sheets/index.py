import json
import os
import psycopg2
import urllib.request
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Import broker objects from Google Sheets to database
    Args: event with httpMethod, headers (X-User-Id)
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
        
        cur.execute(f"SELECT is_admin FROM users WHERE id = {int(user_id)}")
        user_row = cur.fetchone()
        
        if not user_row or not user_row[0]:
            return error_response('Admin access required', 403)
        
        cur.execute("SELECT id, name, email FROM users WHERE role = 'broker' ORDER BY id")
        brokers = cur.fetchall()
        
        if not brokers:
            return error_response('No brokers found', 404)
        
        SHEET_ID = '1jnOO6dUJ6z903U1IVd8eZRJR7l-gn_62oJ9y-sQUnaU'
        
        total_imported = 0
        total_deleted = 0
        broker_results = []
        
        for broker_id, broker_name, broker_email in brokers:
            sheet_name = broker_name
            csv_url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={urllib.parse.quote(sheet_name)}'
            
            try:
                with urllib.request.urlopen(csv_url) as response:
                    csv_text = response.read().decode('utf-8')
                
                rows = parse_csv(csv_text)
                
                if not rows or len(rows) < 2:
                    broker_results.append({
                        'broker': broker_name,
                        'status': 'skipped',
                        'message': 'No data or sheet not found'
                    })
                    continue
                
                cur.execute(f"DELETE FROM investment_objects WHERE broker_id = {broker_id}")
                deleted_count = cur.rowcount
                total_deleted += deleted_count
                
                imported_count = 0
                for row in rows[3:]:
                    obj = map_row_to_object(row, broker_id)
                    if obj:
                        try:
                            title_safe = obj['title'].replace("'", "''")
                            strategy_safe = obj['strategy'].replace("'", "''")
                            deal_cycle_safe = obj['deal_cycle'].replace("'", "''")
                            presentation_safe = obj['presentation_link'].replace("'", "''")
                            decision_safe = obj['investment_decision'].replace("'", "''")
                            images_json = json.dumps(obj['images']).replace("'", "''")
                            
                            cur.execute(f"""
                                INSERT INTO investment_objects 
                                (broker_id, title, price, yield_percent, min_investment, 
                                 monthly_payment, strategy, deal_cycle, presentation_link, 
                                 investment_decision, images, status, city, address, 
                                 property_type, area, description)
                                VALUES (
                                    {obj['broker_id']}, 
                                    '{title_safe}',
                                    {obj['price']}, 
                                    {obj['yield_percent']}, 
                                    {obj['min_investment']},
                                    {obj['monthly_payment']},
                                    '{strategy_safe}',
                                    '{deal_cycle_safe}',
                                    '{presentation_safe}',
                                    '{decision_safe}',
                                    '{images_json}', 
                                    '{obj['status']}',
                                    'Москва',
                                    '',
                                    'flats',
                                    0,
                                    'Описание будет добавлено брокером'
                                )
                            """)
                            imported_count += 1
                        except Exception as e:
                            print(f"Error importing object for {broker_name}: {e}, row: {row}")
                
                total_imported += imported_count
                broker_results.append({
                    'broker': broker_name,
                    'status': 'success',
                    'deleted': deleted_count,
                    'imported': imported_count
                })
                
            except Exception as e:
                broker_results.append({
                    'broker': broker_name,
                    'status': 'error',
                    'message': str(e)
                })
        
        conn.commit()
        
        return success_response({
            'message': 'Import completed',
            'total_deleted': total_deleted,
            'total_imported': total_imported,
            'brokers': broker_results
        })
    
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(f'Import failed: {str(e)}', 500)
    
    finally:
        if conn:
            conn.close()


def parse_csv(csv_text: str) -> List[List[str]]:
    lines = [line for line in csv_text.split('\n') if line.strip()]
    if not lines:
        return []
    
    rows = []
    for line in lines:
        rows.append(parse_csv_line(line))
    
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


def map_row_to_object(row: List[str], broker_id: int) -> Dict[str, Any]:
    def parse_number(value: str) -> float:
        if not value or value in ['?', 'н/д', '']:
            return 0.0
        cleaned = ''.join(c for c in str(value) if c.isdigit() or c in '.,')
        cleaned = cleaned.replace(',', '.')
        try:
            return float(cleaned)
        except:
            return 0.0
    
    def get_col(row: List[str], index: int) -> str:
        return row[index].strip() if index < len(row) else ''
    
    title = get_col(row, 0)
    if not title or title in ['Объект / фокус внимания', '']:
        return None
    
    return {
        'broker_id': broker_id,
        'title': title,
        'min_investment': parse_number(get_col(row, 3)),
        'price': parse_number(get_col(row, 4)),
        'monthly_payment': parse_number(get_col(row, 5)),
        'strategy': get_col(row, 6),
        'deal_cycle': get_col(row, 7),
        'yield_percent': parse_number(get_col(row, 8)),
        'presentation_link': get_col(row, 12),
        'investment_decision': get_col(row, 14),
        'images': ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'],
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
