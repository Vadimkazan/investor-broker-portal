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
    Business: API для управления инвесторами и воронкой продаж
    Args: event с httpMethod (GET, POST, PUT), queryStringParameters, body
    Returns: HTTP response с данными инвесторов
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
            investor_id = event.get('queryStringParameters', {}).get('id')
            broker_id = event.get('queryStringParameters', {}).get('brokerId')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if investor_id:
                    query = f"SELECT * FROM investors WHERE id = {escape_sql(investor_id)}"
                    cur.execute(query)
                    investor = cur.fetchone()
                    if not investor:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Investor not found'}),
                            'isBase64Encoded': False
                        }
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(dict(investor), default=str),
                        'isBase64Encoded': False
                    }
                elif broker_id:
                    query = f"SELECT * FROM investors WHERE broker_id = {escape_sql(broker_id)} ORDER BY created_at DESC"
                    cur.execute(query)
                    investors = cur.fetchall()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps([dict(i) for i in investors], default=str),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Broker ID required'}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            investor_id = str(uuid.uuid4())
            
            strategies_json = escape_sql(json.dumps(body_data['investmentProfile']['strategies']))
            property_types_json = escape_sql(json.dumps(body_data['investmentProfile']['preferredPropertyTypes']))
            locations_json = escape_sql(json.dumps(body_data['investmentProfile']['preferredLocations']))
            timeline_json = escape_sql(json.dumps([{
                'date': str(body_data.get('metadata', {}).get('createdAt', '')),
                'action': 'Создан лид',
                'details': f"Источник: {body_data['interaction']['source']}"
            }]))
            
            query = f"""
                INSERT INTO investors (
                    id, broker_id, first_name, last_name, email, phone,
                    stage, profile_budget, profile_strategies, profile_risk_tolerance,
                    profile_preferred_property_types, profile_preferred_locations,
                    interaction_source, interaction_notes, timeline
                ) VALUES (
                    {escape_sql(investor_id)}, {escape_sql(body_data['brokerId'])}, 
                    {escape_sql(body_data['personalInfo']['firstName'])}, {escape_sql(body_data['personalInfo']['lastName'])}, 
                    {escape_sql(body_data['personalInfo']['email'])}, {escape_sql(body_data['personalInfo']['phone'])},
                    {escape_sql(body_data.get('stage', 'lead'))}, {escape_sql(body_data['investmentProfile']['budget'])}, 
                    {strategies_json}, {escape_sql(body_data['investmentProfile']['riskTolerance'])},
                    {property_types_json}, {locations_json},
                    {escape_sql(body_data['interaction']['source'])}, {escape_sql(body_data['interaction'].get('notes', ''))}, 
                    {timeline_json}
                )
            """
            
            with conn.cursor() as cur:
                cur.execute(query)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM investors WHERE id = {escape_sql(investor_id)}")
                investor = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(investor), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            investor_id = body_data.get('id')
            
            if not investor_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Investor ID required'}),
                    'isBase64Encoded': False
                }
            
            query = f"""
                UPDATE investors 
                SET stage = {escape_sql(body_data.get('stage'))}, 
                    interaction_notes = {escape_sql(body_data.get('interaction', {}).get('notes', ''))}, 
                    interaction_last_contact = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {escape_sql(investor_id)}
            """
            
            with conn.cursor() as cur:
                cur.execute(query)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM investors WHERE id = {escape_sql(investor_id)}")
                investor = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(investor), default=str),
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
