import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Content-Type': 'application/json',
}


def schema() -> str:
    s = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f'{s}.' if s else ''


def conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def num(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    return float(value or 0)


def esc(value: Any) -> str:
    if value is None or value == '':
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def row_to_dict(r) -> Dict[str, Any]:
    return {
        'id': r[0],
        'title': r[1],
        'propertyType': r[2],
        'city': r[3] or '',
        'address': r[4] or '',
        'purchasePrice': num(r[5]),
        'purchaseDate': r[6].isoformat() if r[6] else None,
        'currentValue': num(r[7]),
        'monthlyIncome': num(r[8]),
        'imageUrl': r[9],
        'notes': r[10] or '',
        'createdAt': r[11].isoformat() if r[11] else None,
    }


FIELDS = '''id, title, property_type, city, address, purchase_price,
            purchase_date, current_value, monthly_income, image_url, notes, created_at'''


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Личный учёт недвижимости инвестора — приватный список, не виден другим пользователям
    Args: event с httpMethod, queryStringParameters (user_id, id), body с данными объекта
    Returns: HTTP response со списком объектов или результатом операции
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')

    user_id = params.get('user_id') or body.get('userId')
    if not user_id or not str(user_id).isdigit():
        return {'statusCode': 400, 'headers': CORS,
                'body': json.dumps({'error': 'user_id обязателен'}), 'isBase64Encoded': False}
    user_id = int(user_id)

    s = schema()
    connection = conn()
    try:
        cur = connection.cursor()

        if method == 'GET':
            cur.execute(f"""SELECT {FIELDS} FROM {s}investor_properties
                            WHERE user_id = {user_id} ORDER BY created_at DESC""")
            items = [row_to_dict(r) for r in cur.fetchall()]

            total_invested = sum(i['purchasePrice'] for i in items)
            total_value = sum(i['currentValue'] or i['purchasePrice'] for i in items)
            monthly = sum(i['monthlyIncome'] for i in items)
            growth = total_value - total_invested
            growth_pct = round(growth / total_invested * 100, 2) if total_invested else 0.0
            yield_pct = round(monthly * 12 / total_value * 100, 2) if total_value else 0.0

            return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False,
                    'body': json.dumps({
                        'items': items,
                        'summary': {
                            'count': len(items),
                            'totalInvested': total_invested,
                            'totalValue': total_value,
                            'growth': growth,
                            'growthPercent': growth_pct,
                            'monthlyIncome': monthly,
                            'yearlyIncome': monthly * 12,
                            'yieldPercent': yield_pct,
                        }})}

        if method == 'POST':
            cur.execute(f"""
                INSERT INTO {s}investor_properties
                    (user_id, title, property_type, city, address, purchase_price,
                     purchase_date, current_value, monthly_income, image_url, notes)
                VALUES ({user_id}, {esc(body.get('title'))}, {esc(body.get('propertyType') or 'apartments')},
                        {esc(body.get('city'))}, {esc(body.get('address'))},
                        {num(body.get('purchasePrice'))}, {esc(body.get('purchaseDate'))},
                        {num(body.get('currentValue'))}, {num(body.get('monthlyIncome'))},
                        {esc(body.get('imageUrl'))}, {esc(body.get('notes'))})
                RETURNING {FIELDS}
            """)
            item = row_to_dict(cur.fetchone())
            connection.commit()
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps(item), 'isBase64Encoded': False}

        if method == 'PUT':
            prop_id = params.get('id') or body.get('id')
            if not prop_id or not str(prop_id).isdigit():
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': 'id обязателен'}), 'isBase64Encoded': False}
            cur.execute(f"""
                UPDATE {s}investor_properties SET
                    title = {esc(body.get('title'))},
                    property_type = {esc(body.get('propertyType') or 'apartments')},
                    city = {esc(body.get('city'))},
                    address = {esc(body.get('address'))},
                    purchase_price = {num(body.get('purchasePrice'))},
                    purchase_date = {esc(body.get('purchaseDate'))},
                    current_value = {num(body.get('currentValue'))},
                    monthly_income = {num(body.get('monthlyIncome'))},
                    image_url = {esc(body.get('imageUrl'))},
                    notes = {esc(body.get('notes'))},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(prop_id)} AND user_id = {user_id}
                RETURNING {FIELDS}
            """)
            row = cur.fetchone()
            connection.commit()
            if not row:
                return {'statusCode': 404, 'headers': CORS,
                        'body': json.dumps({'error': 'Объект не найден'}), 'isBase64Encoded': False}
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps(row_to_dict(row)), 'isBase64Encoded': False}

        if method == 'DELETE':
            prop_id = params.get('id') or body.get('id')
            if not prop_id or not str(prop_id).isdigit():
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': 'id обязателен'}), 'isBase64Encoded': False}
            cur.execute(f"""DELETE FROM {s}investor_properties
                            WHERE id = {int(prop_id)} AND user_id = {user_id}""")
            connection.commit()
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        return {'statusCode': 405, 'headers': CORS,
                'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
    finally:
        connection.close()
