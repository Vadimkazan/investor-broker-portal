import json
import os
import psycopg2
from typing import Dict, Any, List, Optional

def escape_sql(value):
    '''Escape values for Simple Query Protocol'''
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return "'" + value.replace("'", "''").replace('\\', '\\\\') + "'"
    return "'" + str(value).replace("'", "''").replace('\\', '\\\\') + "'"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление пользователями (создание, просмотр, редактирование, удаление брокеров и инвесторов)
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict с данными пользователей или статусом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    try:
        cur = conn.cursor()
        
        if method == 'GET':
            cur.execute("SELECT id, email, name, role FROM users ORDER BY id")
            rows = cur.fetchall()
            users = [{'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3]} for row in rows]
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'users': users})
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            email = body_data.get('email')
            name = body_data.get('name')
            role = body_data.get('role', 'investor')
            
            if not email or not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Email и имя обязательны'})
                }
            
            query = f"""
                INSERT INTO users (email, name, role) 
                VALUES ({escape_sql(email)}, {escape_sql(name)}, {escape_sql(role)}) 
                ON CONFLICT (email) 
                DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role 
                RETURNING id, email, name, role
            """
            cur.execute(query)
            row = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'user': {'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3]}})
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('id')
            email = body_data.get('email')
            name = body_data.get('name')
            role = body_data.get('role')
            
            if not user_id or not email or not name or not role:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Все поля обязательны'})
                }
            
            query = f"""
                UPDATE users 
                SET email = {escape_sql(email)}, name = {escape_sql(name)}, role = {escape_sql(role)} 
                WHERE id = {escape_sql(int(user_id))} 
                RETURNING id, email, name, role
            """
            cur.execute(query)
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'user': {'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3]}})
            }
        
        if method == 'DELETE':
            params = event.get('queryStringParameters', {})
            user_id = params.get('id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'ID пользователя обязателен'})
                }
            
            query = f"DELETE FROM users WHERE id = {escape_sql(int(user_id))}"
            cur.execute(query)
            deleted = cur.rowcount > 0
            
            if not deleted:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        conn.close()
