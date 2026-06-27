import json
import os
import psycopg2
import hashlib
import hmac
from typing import Dict, Any, List, Optional

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)

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
    Business: Main API - users, objects, favorites management
    Args: event with httpMethod, body, queryStringParameters, pathParams
    Returns: HTTP response with JSON data
    '''
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', 'objects')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        if resource == 'users':
            return handle_users(cur, method, event)
        elif resource == 'objects':
            return handle_objects(cur, method, event)
        elif resource == 'favorites':
            return handle_favorites(cur, method, event)
        elif resource == 'auth':
            return handle_auth(cur, method, event)
        else:
            return error_response('Resource not found', 404)
    
    finally:
        if conn:
            conn.close()


def handle_users(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('id')
        email = params.get('email')
        
        if user_id:
            query = f"SELECT id, email, name, role, created_at FROM users WHERE id = {escape_sql(int(user_id))}"
            cur.execute(query)
            row = cur.fetchone()
            if row:
                return success_response({
                    'id': row[0], 'email': row[1], 'name': row[2],
                    'role': row[3], 'created_at': row[4].isoformat() if row[4] else None
                })
            return error_response('User not found', 404)
        
        elif email:
            query = f"SELECT id, email, name, role, created_at FROM users WHERE email = {escape_sql(email)}"
            cur.execute(query)
            row = cur.fetchone()
            if row:
                return success_response({
                    'id': row[0], 'email': row[1], 'name': row[2],
                    'role': row[3], 'created_at': row[4].isoformat() if row[4] else None
                })
            return error_response('User not found', 404)
        
        else:
            cur.execute("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 100")
            rows = cur.fetchall()
            users = [{
                'id': r[0], 'email': r[1], 'name': r[2],
                'role': r[3], 'created_at': r[4].isoformat() if r[4] else None
            } for r in rows]
            return success_response(users)
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        name = body.get('name')
        role = body.get('role', 'investor')
        
        if not email or not name:
            return error_response('Email and name are required', 400)
        
        query = f"SELECT id FROM users WHERE email = {escape_sql(email)}"
        cur.execute(query)
        existing = cur.fetchone()
        
        if existing:
            return success_response({'id': existing[0], 'message': 'User already exists'})
        
        query = f"INSERT INTO users (email, name, role) VALUES ({escape_sql(email)}, {escape_sql(name)}, {escape_sql(role)}) RETURNING id, email, name, role, created_at"
        cur.execute(query)
        row = cur.fetchone()
        
        return success_response({
            'id': row[0], 'email': row[1], 'name': row[2],
            'role': row[3], 'created_at': row[4].isoformat() if row[4] else None
        }, 201)

    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('id')
        if not user_id:
            return error_response('User ID required', 400)
        fields = []
        if 'name' in body:
            fields.append(f"name = {escape_sql(body['name'])}")
        if 'role' in body:
            allowed_roles = ['investor', 'broker', 'admin', 'manager']
            if body['role'] not in allowed_roles:
                return error_response('Invalid role', 400)
            fields.append(f"role = {escape_sql(body['role'])}")
        if 'notify_new_objects' in body:
            fields.append(f"notify_new_objects = {escape_sql(body['notify_new_objects'])}")
        if not fields:
            return error_response('No fields to update', 400)
        cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = {escape_sql(int(user_id))} RETURNING id, email, name, role, created_at")
        row = cur.fetchone()
        if not row:
            return error_response('User not found', 404)
        return success_response({'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'created_at': row[4].isoformat() if row[4] else None})

    elif method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('id')
        if not user_id:
            return error_response('User ID required', 400)
        cur.execute(f"DELETE FROM users WHERE id = {escape_sql(int(user_id))}")
        return success_response({'message': 'Deleted'})

    return error_response('Method not allowed', 405)


def handle_objects(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        object_id = params.get('id')
        
        if object_id:
            query = f"""
                SELECT o.id, o.broker_id, o.title, o.city, o.address, o.property_type, o.area, o.price, 
                       o.yield_percent, o.description, o.images, o.status, o.created_at,
                       u.id, u.name, u.email
                FROM investment_objects o
                LEFT JOIN users u ON o.broker_id = u.id
                WHERE o.id = {escape_sql(int(object_id))}
            """
            cur.execute(query)
            row = cur.fetchone()
            if row:
                return success_response(format_object_with_broker(row))
            return error_response('Object not found', 404)
        
        else:
            query = """
                SELECT o.id, o.broker_id, o.title, o.city, o.address, o.property_type, o.area, o.price, 
                       o.yield_percent, o.description, o.images, o.status, o.created_at,
                       u.id, u.name, u.email
                FROM investment_objects o
                LEFT JOIN users u ON o.broker_id = u.id
                ORDER BY o.created_at DESC LIMIT 100
            """
            cur.execute(query)
            rows = cur.fetchall()
            return success_response([format_object_with_broker(r) for r in rows])

    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        images_json = escape_sql(json.dumps(body.get('images', [])))
        query = f"""
            INSERT INTO investment_objects (
                broker_id, title, city, address, property_type, area, price,
                yield_percent, payback_years, description, images, status
            ) VALUES (
                {escape_sql(body.get('broker_id'))},
                {escape_sql(body.get('title'))},
                {escape_sql(body.get('city'))},
                {escape_sql(body.get('address'))},
                {escape_sql(body.get('property_type', 'flats'))},
                {escape_sql(body.get('area', 0))},
                {escape_sql(body.get('price', 0))},
                {escape_sql(body.get('yield_percent', 0))},
                {escape_sql(body.get('payback_years', 0))},
                {escape_sql(body.get('description', ''))},
                ARRAY(SELECT json_array_elements_text({images_json}::json)),
                {escape_sql(body.get('status', 'available'))}
            ) RETURNING id
        """
        cur.execute(query)
        row = cur.fetchone()
        new_id = row[0]

        cur.execute(f"""
            SELECT o.id, o.broker_id, o.title, o.city, o.address, o.property_type, o.area, o.price, 
                   o.yield_percent, o.description, o.images, o.status, o.created_at,
                   u.id, u.name, u.email
            FROM investment_objects o
            LEFT JOIN users u ON o.broker_id = u.id
            WHERE o.id = {escape_sql(new_id)}
        """)
        return success_response(format_object_with_broker(cur.fetchone()), 201)

    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        object_id = body.get('id')
        if not object_id:
            return error_response('Object ID required', 400)

        images_json = escape_sql(json.dumps(body.get('images', [])))
        query = f"""
            UPDATE investment_objects SET
                title = {escape_sql(body.get('title'))},
                city = {escape_sql(body.get('city'))},
                address = {escape_sql(body.get('address'))},
                property_type = {escape_sql(body.get('property_type'))},
                area = {escape_sql(body.get('area'))},
                price = {escape_sql(body.get('price'))},
                yield_percent = {escape_sql(body.get('yield_percent'))},
                payback_years = {escape_sql(body.get('payback_years'))},
                description = {escape_sql(body.get('description'))},
                images = ARRAY(SELECT json_array_elements_text({images_json}::json)),
                status = {escape_sql(body.get('status'))}
            WHERE id = {escape_sql(int(object_id))}
        """
        cur.execute(query)

        cur.execute(f"""
            SELECT o.id, o.broker_id, o.title, o.city, o.address, o.property_type, o.area, o.price, 
                   o.yield_percent, o.description, o.images, o.status, o.created_at,
                   u.id, u.name, u.email
            FROM investment_objects o
            LEFT JOIN users u ON o.broker_id = u.id
            WHERE o.id = {escape_sql(int(object_id))}
        """)
        return success_response(format_object_with_broker(cur.fetchone()))

    elif method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        object_id = params.get('id')
        if not object_id:
            return error_response('Object ID required', 400)
        cur.execute(f"DELETE FROM investment_objects WHERE id = {escape_sql(int(object_id))}")
        return success_response({'message': 'Deleted'})

    return error_response('Method not allowed', 405)


def handle_favorites(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('userId')
        
        if not user_id:
            return error_response('User ID required', 400)
        
        query = f"""
            SELECT f.id, f.user_id, f.object_id, f.created_at,
                   o.id, o.broker_id, o.title, o.city, o.address, o.property_type, o.area, o.price, 
                   o.yield_percent, o.description, o.images, o.status, o.created_at
            FROM favorites f
            JOIN investment_objects o ON f.object_id = o.id
            WHERE f.user_id = {escape_sql(int(user_id))}
            ORDER BY f.created_at DESC
        """
        cur.execute(query)
        rows = cur.fetchall()
        
        favorites = []
        for r in rows:
            favorites.append({
                'id': r[0],
                'userId': r[1],
                'objectId': r[2],
                'createdAt': r[3].isoformat() if r[3] else None,
                'object': {
                    'id': r[4], 'brokerId': r[5], 'title': r[6], 'city': r[7],
                    'address': r[8], 'propertyType': r[9], 'area': r[10], 'price': r[11],
                    'yieldPercent': r[12], 'description': r[13], 'images': r[14],
                    'status': r[15], 'createdAt': r[16].isoformat() if r[16] else None
                }
            })
        
        return success_response(favorites)
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        object_id = body.get('objectId')
        
        if not user_id or not object_id:
            return error_response('User ID and Object ID required', 400)
        
        query = f"SELECT id FROM favorites WHERE user_id = {escape_sql(int(user_id))} AND object_id = {escape_sql(int(object_id))}"
        cur.execute(query)
        existing = cur.fetchone()
        
        if existing:
            return success_response({'id': existing[0], 'message': 'Already in favorites'})
        
        query = f"INSERT INTO favorites (user_id, object_id) VALUES ({escape_sql(int(user_id))}, {escape_sql(int(object_id))}) RETURNING id, user_id, object_id, created_at"
        cur.execute(query)
        row = cur.fetchone()
        
        return success_response({
            'id': row[0], 'userId': row[1], 'objectId': row[2],
            'createdAt': row[3].isoformat() if row[3] else None
        }, 201)
    
    elif method == 'DELETE':
        body = json.loads(event.get('body', '{}'))
        favorite_id = body.get('id')
        
        if not favorite_id:
            return error_response('Favorite ID required', 400)
        
        query = f"DELETE FROM favorites WHERE id = {escape_sql(int(favorite_id))}"
        cur.execute(query)
        
        return success_response({'message': 'Favorite removed'})
    
    return error_response('Method not allowed', 405)


def handle_auth(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method != 'POST':
        return error_response('Method not allowed', 405)

    body = json.loads(event.get('body', '{}'))
    action = body.get('action')  # 'login' | 'register' | 'change_password' | 'change_email'
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if action == 'login':
        if not email or not password:
            return error_response('Email and password required', 400)
        cur.execute(f"SELECT id, email, name, role, created_at, password_hash FROM users WHERE email = {escape_sql(email)}")
        row = cur.fetchone()
        if not row:
            return error_response('Пользователь не найден', 404)
        stored_hash = row[5]
        if stored_hash is None:
            return error_response('Пароль не установлен. Обратитесь к администратору.', 401)
        if not verify_password(password, stored_hash):
            return error_response('Неверный пароль', 401)
        return success_response({'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'created_at': row[4].isoformat() if row[4] else None})

    elif action == 'register':
        name = body.get('name', '').strip()
        role = body.get('role', 'investor')
        if not email or not password or not name:
            return error_response('Email, password and name required', 400)
        if role not in ('investor', 'broker'):
            role = 'investor'
        cur.execute(f"SELECT id FROM users WHERE email = {escape_sql(email)}")
        if cur.fetchone():
            return error_response('Пользователь с таким email уже существует', 409)
        ph = hash_password(password)
        cur.execute(f"INSERT INTO users (email, name, role, password_hash) VALUES ({escape_sql(email)}, {escape_sql(name)}, {escape_sql(role)}, {escape_sql(ph)}) RETURNING id, email, name, role, created_at")
        row = cur.fetchone()
        return success_response({'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'created_at': row[4].isoformat() if row[4] else None}, 201)

    elif action == 'change_password':
        user_id = body.get('user_id')
        old_password = body.get('old_password', '')
        new_password = body.get('new_password', '')
        if not user_id or not old_password or not new_password:
            return error_response('user_id, old_password and new_password required', 400)
        cur.execute(f"SELECT password_hash FROM users WHERE id = {escape_sql(int(user_id))}")
        row = cur.fetchone()
        if not row:
            return error_response('User not found', 404)
        if row[0] and not verify_password(old_password, row[0]):
            return error_response('Неверный текущий пароль', 401)
        ph = hash_password(new_password)
        cur.execute(f"UPDATE users SET password_hash = {escape_sql(ph)} WHERE id = {escape_sql(int(user_id))}")
        return success_response({'message': 'Пароль изменён'})

    elif action == 'change_email':
        user_id = body.get('user_id')
        new_email = body.get('new_email', '').strip().lower()
        password = body.get('password', '')
        if not user_id or not new_email or not password:
            return error_response('user_id, new_email and password required', 400)
        cur.execute(f"SELECT password_hash FROM users WHERE id = {escape_sql(int(user_id))}")
        row = cur.fetchone()
        if not row:
            return error_response('User not found', 404)
        if row[0] and not verify_password(password, row[0]):
            return error_response('Неверный пароль', 401)
        cur.execute(f"SELECT id FROM users WHERE email = {escape_sql(new_email)}")
        if cur.fetchone():
            return error_response('Email уже используется', 409)
        cur.execute(f"UPDATE users SET email = {escape_sql(new_email)} WHERE id = {escape_sql(int(user_id))} RETURNING id, email, name, role, created_at")
        row = cur.fetchone()
        return success_response({'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3], 'created_at': row[4].isoformat() if row[4] else None})

    return error_response('Unknown action', 400)


def format_object_with_broker(row) -> Dict[str, Any]:
    return {
        'id': row[0], 'brokerId': row[1], 'title': row[2], 'city': row[3],
        'address': row[4], 'propertyType': row[5], 'area': row[6], 'price': row[7],
        'yieldPercent': row[8], 'description': row[9], 'images': row[10],
        'status': row[11], 'createdAt': row[12].isoformat() if row[12] else None,
        'broker': {'id': row[13], 'name': row[14], 'email': row[15]} if row[13] else None
    }


def success_response(data: Any, status: int = 200) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, default=str),
        'isBase64Encoded': False
    }


def error_response(message: str, status: int = 400) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }