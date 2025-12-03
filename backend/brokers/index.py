import json
import os
import uuid
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

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
    Business: API для управления брокерами
    Args: event с httpMethod (GET, POST, PUT), queryStringParameters, body
    Returns: HTTP response с данными брокера
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Broker-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    try:
        if method == 'GET':
            broker_id = event.get('queryStringParameters', {}).get('id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if broker_id:
                    query = f"SELECT * FROM brokers WHERE id = {escape_sql(broker_id)}"
                    cur.execute(query)
                    broker = cur.fetchone()
                    if not broker:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Broker not found'}),
                            'isBase64Encoded': False
                        }
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(dict(broker), default=str),
                        'isBase64Encoded': False
                    }
                else:
                    cur.execute("SELECT * FROM brokers ORDER BY created_at DESC")
                    brokers = cur.fetchall()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps([dict(b) for b in brokers], default=str),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            broker_id = str(uuid.uuid4())
            referral_code = f"REF-{uuid.uuid4().hex[:8].upper()}"
            
            query = f"""
                INSERT INTO brokers (id, email, first_name, last_name, phone, avatar, company, referral_code)
                VALUES (
                    {escape_sql(broker_id)}, {escape_sql(body_data['email'])}, 
                    {escape_sql(body_data['firstName'])}, {escape_sql(body_data['lastName'])}, 
                    {escape_sql(body_data.get('phone'))}, {escape_sql(body_data.get('avatar'))}, 
                    {escape_sql(body_data.get('company'))}, {escape_sql(referral_code)}
                )
            """
            
            with conn.cursor() as cur:
                cur.execute(query)
                
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM brokers WHERE id = {escape_sql(broker_id)}")
                broker = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(broker), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            broker_id = body_data.get('id')
            
            if not broker_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Broker ID required'}),
                    'isBase64Encoded': False
                }
            
            query = f"""
                UPDATE brokers 
                SET first_name = {escape_sql(body_data.get('firstName'))}, 
                    last_name = {escape_sql(body_data.get('lastName'))}, 
                    phone = {escape_sql(body_data.get('phone'))}, 
                    avatar = {escape_sql(body_data.get('avatar'))}, 
                    company = {escape_sql(body_data.get('company'))}, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {escape_sql(broker_id)}
            """
            
            with conn.cursor() as cur:
                cur.execute(query)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM brokers WHERE id = {escape_sql(broker_id)}")
                broker = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(broker), default=str),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()
