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
        return "'" + value.replace("'", "''") + "'"
    return "'" + str(value).replace("'", "''") + "'"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления объектами недвижимости
    Args: event с httpMethod (GET, POST, PUT, DELETE), queryStringParameters, body
    Returns: HTTP response с данными объектов
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            property_id = event.get('queryStringParameters', {}).get('id')
            broker_id = event.get('queryStringParameters', {}).get('brokerId')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if property_id:
                    query = f"SELECT * FROM properties WHERE id = {escape_sql(property_id)}"
                    cur.execute(query)
                    prop = cur.fetchone()
                    if not prop:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Property not found'}),
                            'isBase64Encoded': False
                        }
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(dict(prop), default=str),
                        'isBase64Encoded': False
                    }
                elif broker_id:
                    query = f"SELECT * FROM properties WHERE broker_id = {escape_sql(broker_id)} ORDER BY created_at DESC"
                    cur.execute(query)
                    props = cur.fetchall()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps([dict(p) for p in props], default=str),
                        'isBase64Encoded': False
                    }
                else:
                    cur.execute("SELECT * FROM properties WHERE status = 'active' ORDER BY created_at DESC LIMIT 100")
                    props = cur.fetchall()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps([dict(p) for p in props], default=str),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            property_id = str(uuid.uuid4())
            
            strategies_json = escape_sql(json.dumps(body_data['investment']['strategy']))
            images_json = escape_sql(json.dumps(body_data.get('media', {}).get('images', [])))
            
            query = f"""
                INSERT INTO properties (
                    id, broker_id, title, description, property_type, status,
                    location_city, location_district, location_address, location_metro, location_metro_distance,
                    pricing_total_price, pricing_price_per_meter, pricing_min_investment, pricing_currency,
                    financing_method, financing_mortgage_rate, financing_down_payment,
                    investment_strategies, investment_expected_return, investment_term, 
                    investment_risk_level, investment_target_investment,
                    details_area, details_rooms, details_floor, details_total_floors,
                    media_images
                ) VALUES (
                    {escape_sql(property_id)}, {escape_sql(body_data['brokerId'])}, 
                    {escape_sql(body_data['title'])}, {escape_sql(body_data['description'])}, 
                    {escape_sql(body_data['propertyType'])}, {escape_sql(body_data.get('status', 'draft'))},
                    {escape_sql(body_data['location']['city'])}, {escape_sql(body_data['location'].get('district'))}, 
                    {escape_sql(body_data['location']['address'])}, {escape_sql(body_data['location'].get('metro'))}, 
                    {escape_sql(body_data['location'].get('metroDistance'))},
                    {escape_sql(body_data['pricing']['totalPrice'])}, {escape_sql(body_data['pricing'].get('pricePerMeter'))}, 
                    {escape_sql(body_data['pricing']['minInvestment'])}, {escape_sql(body_data['pricing'].get('currency', 'RUB'))},
                    {escape_sql(body_data['financing']['method'])}, {escape_sql(body_data['financing'].get('mortgageRate'))}, 
                    {escape_sql(body_data['financing'].get('downPayment'))},
                    {strategies_json}, {escape_sql(body_data['investment']['expectedReturn'])}, 
                    {escape_sql(body_data['investment']['term'])}, {escape_sql(body_data['investment']['riskLevel'])}, 
                    {escape_sql(body_data['investment']['targetInvestment'])},
                    {escape_sql(body_data['details'].get('area'))}, {escape_sql(body_data['details'].get('rooms'))}, 
                    {escape_sql(body_data['details'].get('floor'))}, {escape_sql(body_data['details'].get('totalFloors'))},
                    {images_json}
                )
            """
            
            with conn.cursor() as cur:
                cur.execute(query)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM properties WHERE id = {escape_sql(property_id)}")
                prop = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(prop), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            property_id = body_data.get('id')
            
            if not property_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Property ID required'}),
                    'isBase64Encoded': False
                }
            
            query = f"""
                UPDATE properties 
                SET title = {escape_sql(body_data['title'])}, 
                    description = {escape_sql(body_data['description'])}, 
                    status = {escape_sql(body_data['status'])},
                    pricing_total_price = {escape_sql(body_data['pricing']['totalPrice'])}, 
                    pricing_min_investment = {escape_sql(body_data['pricing']['minInvestment'])},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {escape_sql(property_id)}
            """
            
            with conn.cursor() as cur:
                cur.execute(query)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT * FROM properties WHERE id = {escape_sql(property_id)}")
                prop = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(prop), default=str),
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
