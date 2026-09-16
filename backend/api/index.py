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

def notify_new_object(object_id: int) -> None:
    '''Отправляет подписчикам уведомление о новом объекте (не блокирует ответ)'''
    bot_url = os.environ.get('TELEGRAM_BOT_FUNCTION_URL', '')
    if not bot_url:
        return
    try:
        import urllib.request
        req = urllib.request.Request(
            f"{bot_url}?action=broadcast-object",
            data=json.dumps({'object_id': object_id}).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        urllib.request.urlopen(req, timeout=3)
    except Exception as e:
        print(f"Broadcast trigger failed: {e}")

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
        elif resource == 'investors':
            return handle_investors(cur, method, event)
        elif resource == 'inquiries':
            return handle_inquiries(cur, method, event)
        elif resource == 'views':
            return handle_views(cur, method, event)
        else:
            return error_response('Resource not found', 404)
    
    finally:
        if conn:
            conn.close()


ALLOWED_ROLES = ['investor', 'broker', 'admin', 'manager']

USER_COLS = (
    "id, email, name, role, roles, created_at, broker_id, phone, photo_url, bio, city, "
    "surname, first_name, country, club, training_stream, telegram_username, "
    "telegram_channel, youtube_channel, vk_group, notify_new_objects, updated_at, telegram_chat_id, "
    "notify_channel_posts"
)


def format_user(row) -> Dict[str, Any]:
    return {
        'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3],
        'roles': row[4] if row[4] else ([row[3]] if row[3] else []),
        'created_at': row[5].isoformat() if row[5] else None,
        'broker_id': row[6],
        'phone': row[7], 'photo_url': row[8], 'bio': row[9], 'city': row[10],
        'surname': row[11], 'first_name': row[12], 'country': row[13],
        'club': row[14], 'training_stream': row[15], 'telegram_username': row[16],
        'telegram_channel': row[17], 'youtube_channel': row[18], 'vk_group': row[19],
        'notify_new_objects': row[20],
        'updated_at': row[21].isoformat() if row[21] else None,
        'telegram_chat_id': row[22],
        'notify_channel_posts': row[23],
    }


def roles_array_sql(roles: List[str]) -> str:
    if not roles:
        return "'{}'::text[]"
    return "ARRAY[" + ",".join(escape_sql(r) for r in roles) + "]::text[]"


def handle_users(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('id')
        email = params.get('email')
        role = params.get('role')
        broker_id = params.get('broker_id')
        
        if user_id:
            query = f"SELECT {USER_COLS} FROM users WHERE id = {escape_sql(int(user_id))}"
            cur.execute(query)
            row = cur.fetchone()
            if row:
                return success_response(format_user(row))
            return error_response('User not found', 404)
        
        elif email:
            query = f"SELECT {USER_COLS} FROM users WHERE email = {escape_sql(email)}"
            cur.execute(query)
            row = cur.fetchone()
            if row:
                return success_response(format_user(row))
            return error_response('User not found', 404)
        
        else:
            query = f"SELECT {USER_COLS} FROM users"
            conditions = []
            if role:
                conditions.append(f"{escape_sql(role)} = ANY(roles)")
            if broker_id:
                conditions.append(f"broker_id = {escape_sql(int(broker_id))}")
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            query += " ORDER BY created_at DESC LIMIT 100"
            cur.execute(query)
            rows = cur.fetchall()
            return success_response([format_user(r) for r in rows])
    
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
        
        query = (
            f"INSERT INTO users (email, name, role, roles) "
            f"VALUES ({escape_sql(email)}, {escape_sql(name)}, {escape_sql(role)}, {roles_array_sql([role])}) "
            f"RETURNING id, email, name, role, created_at"
        )
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

        if 'roles' in body:
            roles = body['roles']
            if not isinstance(roles, list) or not roles:
                return error_response('roles must be a non-empty list', 400)
            for r in roles:
                if r not in ALLOWED_ROLES:
                    return error_response(f'Invalid role: {r}', 400)
            fields.append(f"roles = {roles_array_sql(roles)}")
            fields.append(f"role = {escape_sql(roles[0])}")
        elif 'role' in body:
            if body['role'] not in ALLOWED_ROLES:
                return error_response('Invalid role', 400)
            fields.append(f"role = {escape_sql(body['role'])}")
            fields.append(f"roles = {roles_array_sql([body['role']])}")

        simple_text_fields = [
            'name', 'phone', 'photo_url', 'bio', 'city', 'surname', 'first_name',
            'country', 'club', 'training_stream', 'telegram_username',
            'telegram_channel', 'youtube_channel', 'vk_group', 'telegram_chat_id',
        ]
        for f in simple_text_fields:
            if f in body:
                fields.append(f"{f} = {escape_sql(body[f])}")

        if 'notify_new_objects' in body:
            fields.append(f"notify_new_objects = {escape_sql(body['notify_new_objects'])}")
        if 'notify_channel_posts' in body:
            fields.append(f"notify_channel_posts = {escape_sql(body['notify_channel_posts'])}")
        if 'broker_id' in body:
            broker_id = body['broker_id']
            if broker_id is not None:
                cur.execute(f"SELECT id FROM users WHERE id = {escape_sql(int(broker_id))} AND 'broker' = ANY(roles)")
                if not cur.fetchone():
                    return error_response('Broker not found', 404)
            fields.append(f"broker_id = {escape_sql(broker_id)}")
        if not fields:
            return error_response('No fields to update', 400)
        fields.append("updated_at = CURRENT_TIMESTAMP")
        cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = {escape_sql(int(user_id))} RETURNING {USER_COLS}")
        row = cur.fetchone()
        if not row:
            return error_response('User not found', 404)
        return success_response(format_user(row))

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
        result = format_object_with_broker(cur.fetchone())

        if body.get('status', 'available') == 'available':
            notify_new_object(new_id)

        return success_response(result, 201)

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
        oid = escape_sql(int(object_id))
        for table in ('object_views', 'favorites', 'inquiries', 'notifications'):
            cur.execute(f"DELETE FROM {table} WHERE object_id = {oid}")
        cur.execute(f"DELETE FROM investment_objects WHERE id = {oid}")
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


def handle_inquiries(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        broker_id = params.get('broker_id')

        query = """
            SELECT i.id, i.object_id, i.user_id, i.name, i.email, i.phone, i.message, i.status, i.created_at,
                   o.title, o.city, o.broker_id
            FROM inquiries i
            LEFT JOIN investment_objects o ON i.object_id = o.id
        """
        conditions = []
        if user_id:
            conditions.append(f"i.user_id = {escape_sql(int(user_id))}")
        if broker_id:
            conditions.append(f"o.broker_id = {escape_sql(int(broker_id))}")
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY i.created_at DESC LIMIT 200"

        cur.execute(query)
        rows = cur.fetchall()

        inquiries = [{
            'id': r[0], 'objectId': r[1], 'userId': r[2], 'name': r[3], 'email': r[4],
            'phone': r[5], 'message': r[6], 'status': r[7],
            'createdAt': r[8].isoformat() if r[8] else None,
            'objectTitle': r[9], 'objectCity': r[10], 'brokerId': r[11],
        } for r in rows]

        return success_response(inquiries)

    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        object_id = body.get('object_id')
        name = body.get('name')
        email = body.get('email')
        phone = body.get('phone')
        user_id = body.get('user_id')
        message = body.get('message')

        if not object_id or not name or not email or not phone:
            return error_response('object_id, name, email and phone are required', 400)

        query = (
            "INSERT INTO inquiries (object_id, user_id, name, email, phone, message) "
            f"VALUES ({escape_sql(int(object_id))}, {escape_sql(int(user_id)) if user_id else 'NULL'}, "
            f"{escape_sql(name)}, {escape_sql(email)}, {escape_sql(phone)}, {escape_sql(message)}) "
            "RETURNING id, object_id, user_id, name, email, phone, message, status, created_at"
        )
        cur.execute(query)
        row = cur.fetchone()

        return success_response({
            'id': row[0], 'objectId': row[1], 'userId': row[2], 'name': row[3], 'email': row[4],
            'phone': row[5], 'message': row[6], 'status': row[7],
            'createdAt': row[8].isoformat() if row[8] else None,
        }, 201)

    return error_response('Method not allowed', 405)


def handle_views(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')

        if not user_id:
            return error_response('user_id required', 400)

        query = f"""
            SELECT v.id, v.user_id, v.object_id, v.created_at, o.title, o.city
            FROM object_views v
            LEFT JOIN investment_objects o ON v.object_id = o.id
            WHERE v.user_id = {escape_sql(int(user_id))}
            ORDER BY v.created_at DESC
            LIMIT 100
        """
        cur.execute(query)
        rows = cur.fetchall()

        views = [{
            'id': r[0], 'userId': r[1], 'objectId': r[2],
            'createdAt': r[3].isoformat() if r[3] else None,
            'objectTitle': r[4], 'objectCity': r[5],
        } for r in rows]

        return success_response(views)

    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        object_id = body.get('object_id')

        if not user_id or not object_id:
            return error_response('user_id and object_id required', 400)

        query = (
            "INSERT INTO object_views (user_id, object_id) "
            f"VALUES ({escape_sql(int(user_id))}, {escape_sql(int(object_id))}) "
            "RETURNING id, user_id, object_id, created_at"
        )
        cur.execute(query)
        row = cur.fetchone()

        return success_response({
            'id': row[0], 'userId': row[1], 'objectId': row[2],
            'createdAt': row[3].isoformat() if row[3] else None,
        }, 201)

    return error_response('Method not allowed', 405)


def format_investor(row) -> Dict[str, Any]:
    return {
        'id': str(row[0]),
        'brokerId': str(row[1]),
        'personalInfo': {
            'firstName': row[2], 'lastName': row[3], 'email': row[4], 'phone': row[5]
        },
        'investmentProfile': {
            'budget': float(row[6]) if row[6] is not None else 0,
            'strategies': [], 'riskTolerance': 'medium',
            'preferredPropertyTypes': [], 'preferredLocations': []
        },
        'stage': row[8],
        'interaction': {'source': row[7], 'notes': row[9] or ''},
        'timeline': row[10] or [],
        'portfolio': {
            'totalInvested': float(row[11]) if row[11] is not None else 0,
            'activeInvestments': row[12] or 0,
            'totalReturn': float(row[13]) if row[13] is not None else 0,
            'properties': []
        },
        'metadata': {
            'createdAt': row[14].isoformat() if row[14] else None,
            'updatedAt': row[15].isoformat() if row[15] else None
        }
    }


def handle_investors(cur, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    cols = "id, broker_id, first_name, last_name, email, phone, budget, source, stage, notes, timeline, total_invested, active_investments, total_return, created_at, updated_at"

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        broker_id = params.get('broker_id')
        if not broker_id:
            return error_response('broker_id required', 400)
        cur.execute(f"SELECT {cols} FROM broker_investors WHERE broker_id = {escape_sql(int(broker_id))} ORDER BY created_at DESC")
        rows = cur.fetchall()
        return success_response([format_investor(r) for r in rows])

    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        timeline = json.dumps(body.get('timeline', []))
        query = f"""
            INSERT INTO broker_investors (broker_id, first_name, last_name, email, phone, budget, source, stage, notes, timeline)
            VALUES (
                {escape_sql(int(body.get('broker_id')))},
                {escape_sql(body.get('first_name', ''))},
                {escape_sql(body.get('last_name', ''))},
                {escape_sql(body.get('email', ''))},
                {escape_sql(body.get('phone', ''))},
                {escape_sql(body.get('budget', 0) or 0)},
                {escape_sql(body.get('source', ''))},
                {escape_sql(body.get('stage', 'lead'))},
                {escape_sql(body.get('notes', ''))},
                {escape_sql(timeline)}::jsonb
            ) RETURNING {cols}
        """
        cur.execute(query)
        return success_response(format_investor(cur.fetchone()), 201)

    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        investor_id = body.get('id')
        if not investor_id:
            return error_response('Investor ID required', 400)
        fields = []
        if 'stage' in body:
            fields.append(f"stage = {escape_sql(body['stage'])}")
        if 'notes' in body:
            fields.append(f"notes = {escape_sql(body['notes'])}")
        if 'timeline' in body:
            fields.append(f"timeline = {escape_sql(json.dumps(body['timeline']))}::jsonb")
        if 'first_name' in body:
            fields.append(f"first_name = {escape_sql(body['first_name'])}")
        if 'last_name' in body:
            fields.append(f"last_name = {escape_sql(body['last_name'])}")
        if 'email' in body:
            fields.append(f"email = {escape_sql(body['email'])}")
        if 'phone' in body:
            fields.append(f"phone = {escape_sql(body['phone'])}")
        if 'budget' in body:
            fields.append(f"budget = {escape_sql(body['budget'] or 0)}")
        if not fields:
            return error_response('No fields to update', 400)
        fields.append("updated_at = CURRENT_TIMESTAMP")
        cur.execute(f"UPDATE broker_investors SET {', '.join(fields)} WHERE id = {escape_sql(int(investor_id))} RETURNING {cols}")
        row = cur.fetchone()
        if not row:
            return error_response('Investor not found', 404)
        return success_response(format_investor(row))

    elif method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        investor_id = params.get('id')
        if not investor_id:
            return error_response('Investor ID required', 400)
        cur.execute(f"DELETE FROM broker_investors WHERE id = {escape_sql(int(investor_id))}")
        return success_response({'message': 'Deleted'})

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
        cur.execute(f"SELECT {USER_COLS}, password_hash FROM users WHERE email = {escape_sql(email)}")
        row = cur.fetchone()
        if not row:
            return error_response('Пользователь не найден', 404)
        stored_hash = row[-1]
        if stored_hash is None:
            return error_response('Пароль не установлен. Обратитесь к администратору.', 401)
        if not verify_password(password, stored_hash):
            return error_response('Неверный пароль', 401)
        return success_response(format_user(row))

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

        broker_id = None
        if role == 'investor':
            broker_id = body.get('broker_id')
            if broker_id is not None:
                cur.execute(f"SELECT id FROM users WHERE id = {escape_sql(int(broker_id))} AND 'broker' = ANY(roles)")
                if not cur.fetchone():
                    broker_id = None
            if broker_id is None:
                # Автопривязка: брокер уже добавил этого инвестора в свою CRM по email
                cur.execute(f"SELECT broker_id FROM broker_investors WHERE email = {escape_sql(email)} ORDER BY created_at ASC LIMIT 1")
                crm_row = cur.fetchone()
                if crm_row:
                    broker_id = crm_row[0]

        ph = hash_password(password)
        cur.execute(
            f"INSERT INTO users (email, name, role, roles, password_hash, broker_id) "
            f"VALUES ({escape_sql(email)}, {escape_sql(name)}, {escape_sql(role)}, {roles_array_sql([role])}, {escape_sql(ph)}, {escape_sql(broker_id)}) "
            f"RETURNING {USER_COLS}"
        )
        row = cur.fetchone()
        return success_response(format_user(row), 201)

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
        cur.execute(f"UPDATE users SET email = {escape_sql(new_email)} WHERE id = {escape_sql(int(user_id))} RETURNING {USER_COLS}")
        row = cur.fetchone()
        return success_response(format_user(row))

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