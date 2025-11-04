import json
import os
import psycopg2
from typing import Dict, Any, List, Optional

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
        cur = conn.cursor()
        
        if resource == 'users':
            return handle_users(cur, conn, method, event)
        elif resource == 'objects':
            return handle_objects(cur, conn, method, event)
        elif resource == 'favorites':
            return handle_favorites(cur, conn, method, event)
        elif resource == 'notifications':
            return handle_notifications(cur, conn, method, event)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Resource not found'}),
                'isBase64Encoded': False
            }
    
    finally:
        if conn:
            conn.close()


def handle_users(cur, conn, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('id')
        email = params.get('email')
        
        if user_id:
            cur.execute(
                "SELECT id, email, name, role, is_admin, created_at FROM users WHERE id = %s",
                (int(user_id),)
            )
            row = cur.fetchone()
            if row:
                return success_response({
                    'id': row[0], 'email': row[1], 'name': row[2],
                    'role': row[3], 'is_admin': row[4] or False,
                    'created_at': row[5].isoformat() if row[5] else None
                })
            return error_response('User not found', 404)
        
        elif email:
            cur.execute(
                "SELECT id, email, name, role, is_admin, created_at FROM users WHERE email = %s",
                (email,)
            )
            row = cur.fetchone()
            if row:
                return success_response({
                    'id': row[0], 'email': row[1], 'name': row[2],
                    'role': row[3], 'is_admin': row[4] or False,
                    'created_at': row[5].isoformat() if row[5] else None
                })
            return error_response('User not found', 404)
        
        else:
            cur.execute("SELECT id, email, name, role, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 100")
            rows = cur.fetchall()
            users = [{
                'id': r[0], 'email': r[1], 'name': r[2],
                'role': r[3], 'is_admin': r[4] or False,
                'created_at': r[5].isoformat() if r[5] else None
            } for r in rows]
            return success_response(users)
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        name = body.get('name')
        role = body.get('role', 'investor')
        
        if not email or not name:
            return error_response('Email and name are required', 400)
        
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing = cur.fetchone()
        
        if existing:
            return success_response({'id': existing[0], 'message': 'User already exists'})
        
        cur.execute(
            "INSERT INTO users (email, name, role) VALUES (%s, %s, %s) RETURNING id, email, name, role, is_admin, created_at",
            (email, name, role)
        )
        row = cur.fetchone()
        conn.commit()
        
        return success_response({
            'id': row[0], 'email': row[1], 'name': row[2],
            'role': row[3], 'is_admin': row[4] or False,
            'created_at': row[5].isoformat() if row[5] else None
        }, 201)
    
    return error_response('Method not allowed', 405)


def handle_objects(cur, conn, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        object_id = params.get('id')
        
        if object_id:
            cur.execute("""
                SELECT id, broker_id, title, city, address, property_type, area, price, 
                       yield_percent, payback_years, description, images, videos, documents, status, created_at
                FROM investment_objects WHERE id = %s
            """, (int(object_id),))
            row = cur.fetchone()
            
            if row:
                return success_response(format_object(row))
            return error_response('Object not found', 404)
        
        else:
            filters = build_object_filters(params)
            query = f"""
                SELECT id, broker_id, title, city, address, property_type, area, price, 
                       yield_percent, payback_years, description, images, videos, documents, status, created_at
                FROM investment_objects WHERE 1=1 {filters['query']}
                ORDER BY created_at DESC LIMIT 100
            """
            
            cur.execute(query, filters['params'])
            rows = cur.fetchall()
            objects = [format_object(r) for r in rows]
            return success_response(objects)
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        required_fields = ['title', 'city', 'address', 'property_type', 'area', 'price', 'yield_percent', 'payback_years']
        if not all(body.get(f) for f in required_fields):
            return error_response('Missing required fields', 400)
        
        cur.execute("""
            INSERT INTO investment_objects 
            (broker_id, title, city, address, property_type, area, price, yield_percent, 
             payback_years, description, images, videos, documents, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, broker_id, title, city, address, property_type, area, price, 
                      yield_percent, payback_years, description, images, videos, documents, status, created_at
        """, (
            body.get('broker_id'), body['title'], body['city'], body['address'],
            body['property_type'], body['area'], body['price'], body['yield_percent'],
            body['payback_years'], body.get('description', ''), body.get('images', []),
            body.get('videos', []), body.get('documents', []), body.get('status', 'available')
        ))
        
        row = cur.fetchone()
        conn.commit()
        return success_response(format_object(row), 201)
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        object_id = body.get('id')
        
        if not object_id:
            return error_response('Object ID is required', 400)
        
        updates = []
        params = []
        
        user_id = event.get('headers', {}).get('x-user-id')
        
        if user_id:
            cur.execute("SELECT is_admin, role, id FROM users WHERE id = %s", (int(user_id),))
            user_row = cur.fetchone()
            if user_row:
                is_admin, user_role, uid = user_row[0], user_row[1], user_row[2]
                
                cur.execute("SELECT broker_id FROM investment_objects WHERE id = %s", (int(object_id),))
                obj_row = cur.fetchone()
                
                if obj_row and obj_row[0] != uid and not is_admin:
                    return error_response('Access denied: only object owner or admin can edit', 403)
        
        for field in ['status', 'price', 'yield_percent', 'description', 'images', 'videos', 'documents']:
            if field in body:
                updates.append(f"{field} = %s")
                params.append(body[field])
        
        if not updates:
            return error_response('No fields to update', 400)
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(int(object_id))
        
        query = f"""
            UPDATE investment_objects SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, broker_id, title, city, address, property_type, area, price, 
                      yield_percent, payback_years, description, images, videos, documents, status, created_at
        """
        
        cur.execute(query, params)
        row = cur.fetchone()
        conn.commit()
        
        if row:
            return success_response(format_object(row))
        return error_response('Object not found', 404)
    
    return error_response('Method not allowed', 405)


def handle_favorites(cur, conn, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        
        if not user_id:
            return error_response('user_id is required', 400)
        
        cur.execute("""
            SELECT f.id, f.user_id, f.object_id, f.created_at,
                   o.title, o.city, o.price, o.yield_percent, o.images
            FROM favorites f
            JOIN investment_objects o ON f.object_id = o.id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
        """, (int(user_id),))
        
        rows = cur.fetchall()
        favorites = [{
            'id': r[0], 'user_id': r[1], 'object_id': r[2],
            'created_at': r[3].isoformat() if r[3] else None,
            'object': {
                'title': r[4], 'city': r[5], 'price': float(r[6]) if r[6] else 0,
                'yield_percent': float(r[7]) if r[7] else 0, 'images': r[8] or []
            }
        } for r in rows]
        
        return success_response(favorites)
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        object_id = body.get('object_id')
        
        if not user_id or not object_id:
            return error_response('user_id and object_id are required', 400)
        
        cur.execute(
            "SELECT id FROM favorites WHERE user_id = %s AND object_id = %s",
            (int(user_id), int(object_id))
        )
        existing = cur.fetchone()
        
        if existing:
            return success_response({'message': 'Already in favorites', 'id': existing[0]})
        
        cur.execute(
            "INSERT INTO favorites (user_id, object_id) VALUES (%s, %s) RETURNING id, user_id, object_id, created_at",
            (int(user_id), int(object_id))
        )
        row = cur.fetchone()
        
        cur.execute("""
            SELECT o.broker_id, o.title, u.name as investor_name
            FROM investment_objects o
            JOIN users u ON u.id = %s
            WHERE o.id = %s AND o.broker_id IS NOT NULL
        """, (int(user_id), int(object_id)))
        
        notify_data = cur.fetchone()
        if notify_data and notify_data[0]:
            broker_id, object_title, investor_name = notify_data
            
            cur.execute("""
                INSERT INTO notifications (user_id, type, title, message, object_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                broker_id,
                'favorite_added',
                'Новое избранное',
                f'{investor_name} добавил объект "{object_title}" в избранное',
                int(object_id)
            ))
        
        conn.commit()
        
        return success_response({
            'id': row[0], 'user_id': row[1], 'object_id': row[2],
            'created_at': row[3].isoformat() if row[3] else None
        }, 201)
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        object_id = params.get('object_id')
        
        if not user_id or not object_id:
            return error_response('user_id and object_id are required', 400)
        
        cur.execute(
            "SELECT id FROM favorites WHERE user_id = %s AND object_id = %s",
            (int(user_id), int(object_id))
        )
        row = cur.fetchone()
        
        if not row:
            return error_response('Favorite not found', 404)
        
        return success_response({'message': 'Favorite removed', 'id': row[0]})
    
    return error_response('Method not allowed', 405)


def handle_notifications(cur, conn, method: str, event: Dict[str, Any]) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        
        if not user_id:
            return error_response('user_id is required', 400)
        
        cur.execute("""
            SELECT id, user_id, type, title, message, object_id, is_read, created_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (int(user_id),))
        
        rows = cur.fetchall()
        notifications = [{
            'id': r[0], 'user_id': r[1], 'type': r[2], 'title': r[3],
            'message': r[4], 'object_id': r[5], 'is_read': r[6],
            'created_at': r[7].isoformat() if r[7] else None
        } for r in rows]
        
        return success_response(notifications)
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        notification_id = body.get('id')
        
        if not notification_id:
            return error_response('Notification ID is required', 400)
        
        cur.execute("""
            UPDATE notifications SET is_read = TRUE
            WHERE id = %s
            RETURNING id, user_id, type, title, message, object_id, is_read, created_at
        """, (int(notification_id),))
        
        row = cur.fetchone()
        conn.commit()
        
        if row:
            return success_response({
                'id': row[0], 'user_id': row[1], 'type': row[2], 'title': row[3],
                'message': row[4], 'object_id': row[5], 'is_read': row[6],
                'created_at': row[7].isoformat() if row[7] else None
            })
        return error_response('Notification not found', 404)
    
    return error_response('Method not allowed', 405)


def format_object(row) -> Dict[str, Any]:
    return {
        'id': row[0], 'broker_id': row[1], 'title': row[2], 'city': row[3],
        'address': row[4], 'property_type': row[5],
        'area': float(row[6]) if row[6] else 0,
        'price': float(row[7]) if row[7] else 0,
        'yield_percent': float(row[8]) if row[8] else 0,
        'payback_years': float(row[9]) if row[9] else 0,
        'description': row[10], 'images': row[11] or [],
        'videos': row[12] or [], 'documents': row[13] or [],
        'status': row[14], 'created_at': row[15].isoformat() if row[15] else None
    }


def build_object_filters(params: Dict[str, str]) -> Dict[str, Any]:
    query = ""
    query_params: List[Any] = []
    
    filters = {
        'city': 'city = %s',
        'property_type': 'property_type = %s',
        'status': 'status = %s'
    }
    
    for key, condition in filters.items():
        if key in params:
            query += f" AND {condition}"
            query_params.append(params[key])
    
    if 'min_price' in params:
        query += " AND price >= %s"
        query_params.append(float(params['min_price']))
    
    if 'max_price' in params:
        query += " AND price <= %s"
        query_params.append(float(params['max_price']))
    
    if 'min_yield' in params:
        query += " AND yield_percent >= %s"
        query_params.append(float(params['min_yield']))
    
    if 'max_yield' in params:
        query += " AND yield_percent <= %s"
        query_params.append(float(params['max_yield']))
    
    return {'query': query, 'params': query_params}


def success_response(data: Any, status: int = 200) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(data),
        'isBase64Encoded': False
    }


def error_response(message: str, status: int = 400) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }