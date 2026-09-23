import json
import os
import socket
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple

import psycopg2

_TELEGRAM_WORKING_IP = '149.154.167.220'
_original_getaddrinfo = socket.getaddrinfo


def _patched_getaddrinfo(host, *args, **kwargs):
    if host == 'api.telegram.org':
        host = _TELEGRAM_WORKING_IP
    return _original_getaddrinfo(host, *args, **kwargs)


socket.getaddrinfo = _patched_getaddrinfo

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Content-Type': 'application/json',
}

CHANNEL_LABELS = {'telegram': 'Telegram', 'max': 'MAX', 'site': 'Заявка с сайта', 'manual': 'Добавлен вручную'}

SENDABLE_CHANNELS = ('telegram', 'max')


def esc(value):
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace('\\', '\\\\').replace("'", "''") + "'"


def resp(status: int, data: Any) -> Dict[str, Any]:
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(data, default=str), 'isBase64Encoded': False}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def http_post(url: str, payload: dict, timeout: int = 3) -> Tuple[bool, str]:
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return True, r.read().decode()[:400]
    except urllib.error.HTTPError as e:
        return False, f'HTTP {e.code}: {e.read().decode()[:300]}'
    except Exception as e:
        return False, str(e)[:300]


def send_telegram(chat_id: str, text: str) -> Tuple[bool, str]:
    token = os.environ.get('TELEGRAM_AUTH_BOT_TOKEN') or os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return False, 'TELEGRAM_BOT_TOKEN не настроен'
    ok, info = http_post(
        f'https://api.telegram.org/bot{token}/sendMessage',
        {'chat_id': chat_id, 'text': text},
    )
    return ok, info


def send_max(chat_id: str, text: str) -> Tuple[bool, str]:
    token = os.environ.get('MAX_BOT_TOKEN', '')
    if not token:
        return False, 'MAX_BOT_TOKEN не настроен'
    ok, info = http_post(
        f'https://botapi.max.ru/messages?access_token={token}&chat_id={chat_id}',
        {'text': text},
    )
    return ok, info


def upsert_conversation(cur, channel: str, external_id: str, username: Optional[str], display_name: str) -> int:
    cur.execute(
        f"SELECT id, contact_id FROM crm_conversations "
        f"WHERE channel = {esc(channel)} AND external_id = {esc(str(external_id))}"
    )
    row = cur.fetchone()
    if row:
        return row[0]

    cur.execute(
        f"INSERT INTO crm_contacts (display_name) VALUES ({esc(display_name)}) RETURNING id"
    )
    contact_id = cur.fetchone()[0]

    cur.execute(
        f"INSERT INTO crm_conversations (contact_id, channel, external_id, external_username) "
        f"VALUES ({contact_id}, {esc(channel)}, {esc(str(external_id))}, {esc(username)}) RETURNING id"
    )
    return cur.fetchone()[0]


def store_incoming(cur, channel: str, external_id: str, username: Optional[str],
                   display_name: str, text: str, external_message_id: Optional[str]) -> int:
    conv_id = upsert_conversation(cur, channel, external_id, username, display_name)
    cur.execute(
        f"INSERT INTO crm_messages (conversation_id, direction, body, external_message_id) "
        f"VALUES ({conv_id}, 'in', {esc(text)}, {esc(external_message_id)})"
    )
    cur.execute(
        f"UPDATE crm_conversations SET last_message_text = {esc(text[:300])}, "
        f"last_message_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1, "
        f"updated_at = CURRENT_TIMESTAMP, "
        f"status = CASE WHEN status = 'closed' THEN 'new' ELSE status END "
        f"WHERE id = {conv_id}"
    )
    return conv_id


def handle_list(cur, params) -> Dict[str, Any]:
    where = []
    status = params.get('status')
    channel = params.get('channel')
    assignee = params.get('assignee_id')
    search = params.get('search')

    if status and status != 'all':
        where.append(f"c.status = {esc(status)}")
    if channel and channel != 'all':
        where.append(f"c.channel = {esc(channel)}")
    if assignee and assignee != 'all':
        if assignee == 'none':
            where.append("c.assignee_id IS NULL")
        else:
            where.append(f"c.assignee_id = {int(assignee)}")
    if search:
        s = esc(f'%{search}%')
        where.append(f"(ct.display_name ILIKE {s} OR c.external_username ILIKE {s} OR c.last_message_text ILIKE {s})")

    clause = ('WHERE ' + ' AND '.join(where)) if where else ''

    cur.execute(f"""
        SELECT c.id, c.channel, c.external_username, c.status, c.assignee_id,
               c.last_message_text, c.last_message_at, c.unread_count,
               ct.id, ct.display_name, ct.phone, ct.email,
               u.name, c.object_id
        FROM crm_conversations c
        JOIN crm_contacts ct ON ct.id = c.contact_id
        LEFT JOIN users u ON u.id = c.assignee_id
        {clause}
        ORDER BY c.last_message_at DESC NULLS LAST
        LIMIT 200
    """)

    items = [{
        'id': r[0], 'channel': r[1], 'channelLabel': CHANNEL_LABELS.get(r[1], r[1]),
        'username': r[2], 'status': r[3], 'assigneeId': r[4],
        'lastMessage': r[5], 'lastMessageAt': r[6], 'unread': r[7],
        'contactId': r[8], 'contactName': r[9], 'phone': r[10], 'email': r[11],
        'assigneeName': r[12], 'objectId': r[13],
    } for r in cur.fetchall()]

    cur.execute("""
        SELECT status, COUNT(*), COALESCE(SUM(unread_count), 0)
        FROM crm_conversations GROUP BY status
    """)
    counters = {r[0]: {'total': r[1], 'unread': int(r[2])} for r in cur.fetchall()}

    return resp(200, {'items': items, 'counters': counters})


def handle_messages(cur, params) -> Dict[str, Any]:
    conv_id = params.get('conversation_id')
    if not conv_id:
        return resp(400, {'error': 'conversation_id обязателен'})
    conv_id = int(conv_id)

    cur.execute(f"""
        SELECT c.id, c.channel, c.external_id, c.external_username, c.status,
               c.assignee_id, c.object_id, c.unread_count,
               ct.id, ct.display_name, ct.phone, ct.email, ct.note,
               u.name, o.title
        FROM crm_conversations c
        JOIN crm_contacts ct ON ct.id = c.contact_id
        LEFT JOIN users u ON u.id = c.assignee_id
        LEFT JOIN investment_objects o ON o.id = c.object_id
        WHERE c.id = {conv_id}
    """)
    c = cur.fetchone()
    if not c:
        return resp(404, {'error': 'Диалог не найден'})

    cur.execute(f"""
        SELECT m.id, m.direction, m.body, m.created_at, m.delivery_status,
               m.error_text, u.name, m.attachment_url
        FROM crm_messages m
        LEFT JOIN users u ON u.id = m.sender_user_id
        WHERE m.conversation_id = {conv_id}
        ORDER BY m.created_at ASC
        LIMIT 500
    """)
    messages = [{
        'id': r[0], 'direction': r[1], 'body': r[2], 'createdAt': r[3],
        'deliveryStatus': r[4], 'error': r[5], 'senderName': r[6], 'attachment': r[7],
    } for r in cur.fetchall()]

    cur.execute(f"UPDATE crm_conversations SET unread_count = 0 WHERE id = {conv_id}")

    return resp(200, {
        'conversation': {
            'id': c[0], 'channel': c[1], 'channelLabel': CHANNEL_LABELS.get(c[1], c[1]),
            'externalId': c[2], 'username': c[3], 'status': c[4],
            'assigneeId': c[5], 'objectId': c[6],
            'contactId': c[8], 'contactName': c[9], 'phone': c[10],
            'email': c[11], 'note': c[12], 'assigneeName': c[13], 'objectTitle': c[14],
        },
        'messages': messages,
    })


def handle_reply(cur, body) -> Dict[str, Any]:
    conv_id = body.get('conversation_id')
    text = (body.get('text') or '').strip()
    sender_id = body.get('sender_user_id')

    if not conv_id or not text:
        return resp(400, {'error': 'conversation_id и text обязательны'})
    conv_id = int(conv_id)

    cur.execute(f"SELECT channel, external_id FROM crm_conversations WHERE id = {conv_id}")
    row = cur.fetchone()
    if not row:
        return resp(404, {'error': 'Диалог не найден'})

    channel, external_id = row[0], row[1]
    if channel == 'telegram':
        ok, info = send_telegram(external_id, text)
    elif channel == 'max':
        ok, info = send_max(external_id, text)
    else:
        ok, info = False, (
            'В этот диалог нельзя написать из системы — у клиента нет привязанного мессенджера. '
            'Свяжитесь по телефону или email, а результат запишите в заметку.'
        )

    status = 'sent' if ok else 'failed'
    error = None if ok else info

    cur.execute(
        f"INSERT INTO crm_messages (conversation_id, direction, body, sender_user_id, "
        f"delivery_status, error_text) VALUES ({conv_id}, 'out', {esc(text)}, "
        f"{esc(int(sender_id)) if sender_id else 'NULL'}, {esc(status)}, {esc(error)}) RETURNING id"
    )
    msg_id = cur.fetchone()[0]

    if ok:
        cur.execute(
            f"UPDATE crm_conversations SET last_message_text = {esc(text[:300])}, "
            f"last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, "
            f"status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END "
            f"WHERE id = {conv_id}"
        )

    if not ok:
        return resp(502, {'error': 'Сообщение не отправлено', 'detail': info, 'messageId': msg_id})
    return resp(200, {'messageId': msg_id, 'status': status})


def handle_update(cur, body) -> Dict[str, Any]:
    conv_id = body.get('conversation_id')
    if not conv_id:
        return resp(400, {'error': 'conversation_id обязателен'})
    conv_id = int(conv_id)

    sets = []
    if 'status' in body:
        sets.append(f"status = {esc(body['status'])}")
    if 'assignee_id' in body:
        a = body['assignee_id']
        sets.append(f"assignee_id = {int(a) if a else 'NULL'}")
    if 'object_id' in body:
        o = body['object_id']
        sets.append(f"object_id = {int(o) if o else 'NULL'}")

    if sets:
        sets.append('updated_at = CURRENT_TIMESTAMP')
        cur.execute(f"UPDATE crm_conversations SET {', '.join(sets)} WHERE id = {conv_id}")

    contact_sets = []
    for field in ('display_name', 'phone', 'email', 'note'):
        if field in body:
            contact_sets.append(f"{field} = {esc(body[field])}")
    if contact_sets:
        contact_sets.append('updated_at = CURRENT_TIMESTAMP')
        cur.execute(
            f"UPDATE crm_contacts SET {', '.join(contact_sets)} "
            f"WHERE id = (SELECT contact_id FROM crm_conversations WHERE id = {conv_id})"
        )

    return resp(200, {'message': 'Обновлено'})


def handle_create(cur, body) -> Dict[str, Any]:
    """Ручное добавление клиента менеджером."""
    name = (body.get('display_name') or '').strip()
    if not name:
        return resp(400, {'error': 'Укажите имя клиента'})

    phone = (body.get('phone') or '').strip()
    email = (body.get('email') or '').strip()
    note = (body.get('note') or '').strip()
    channel = body.get('channel') or 'manual'
    telegram_id = (body.get('telegram_id') or '').strip()
    assignee_id = body.get('assignee_id')

    if channel == 'telegram' and telegram_id:
        external_id = telegram_id
    elif channel == 'max' and telegram_id:
        external_id = telegram_id
    else:
        channel = 'manual'
        external_id = f"manual-{phone or email or name}"

    cur.execute(
        f"SELECT id FROM crm_conversations WHERE channel = {esc(channel)} "
        f"AND external_id = {esc(external_id)}"
    )
    existing = cur.fetchone()
    if existing:
        return resp(200, {'conversationId': existing[0], 'existing': True})

    cur.execute(
        f"INSERT INTO crm_contacts (display_name, phone, email, note) VALUES "
        f"({esc(name)}, {esc(phone or None)}, {esc(email or None)}, {esc(note or None)}) RETURNING id"
    )
    contact_id = cur.fetchone()[0]

    cur.execute(
        f"INSERT INTO crm_conversations (contact_id, channel, external_id, status, assignee_id, "
        f"last_message_text, last_message_at) VALUES ({contact_id}, {esc(channel)}, {esc(external_id)}, "
        f"'new', {int(assignee_id) if assignee_id else 'NULL'}, "
        f"{esc('Клиент добавлен вручную')}, CURRENT_TIMESTAMP) RETURNING id"
    )
    conv_id = cur.fetchone()[0]

    if note:
        cur.execute(
            f"INSERT INTO crm_messages (conversation_id, direction, body, delivery_status) "
            f"VALUES ({conv_id}, 'in', {esc(note)}, 'sent')"
        )

    return resp(201, {'conversationId': conv_id, 'existing': False})


def handle_webhook(cur, channel: str, payload: dict) -> Dict[str, Any]:
    if channel == 'telegram':
        msg = payload.get('message') or payload.get('edited_message') or {}
        chat = msg.get('chat') or {}
        chat_id = chat.get('id')
        text = msg.get('text') or msg.get('caption') or '[вложение]'
        if not chat_id:
            return resp(200, {'ok': True, 'skipped': 'no chat'})
        name = ' '.join(filter(None, [chat.get('first_name'), chat.get('last_name')])) or \
            chat.get('title') or chat.get('username') or f'Telegram {chat_id}'
        store_incoming(cur, 'telegram', str(chat_id), chat.get('username'),
                       name, text, str(msg.get('message_id') or ''))
        return resp(200, {'ok': True})

    if channel == 'site':
        name = (payload.get('name') or '').strip() or 'Заявка с сайта'
        phone = (payload.get('phone') or '').strip()
        email = (payload.get('email') or '').strip()
        object_id = payload.get('object_id')
        object_title = payload.get('object_title')
        note = (payload.get('message') or '').strip()
        inquiry_id = payload.get('inquiry_id')

        external_id = f"inquiry-{inquiry_id}" if inquiry_id else f"site-{phone or email or name}"

        lines = ['Новая заявка с сайта']
        if object_title:
            lines.append(f'Объект: {object_title}')
        if phone:
            lines.append(f'Телефон: {phone}')
        if email:
            lines.append(f'Email: {email}')
        if note:
            lines.append(f'Сообщение: {note}')
        text = '\n'.join(lines)

        conv_id = store_incoming(cur, 'site', external_id, None, name, text, str(inquiry_id or ''))

        sets = []
        if phone:
            sets.append(f"phone = {esc(phone)}")
        if email:
            sets.append(f"email = {esc(email)}")
        if sets:
            cur.execute(
                f"UPDATE crm_contacts SET {', '.join(sets)} "
                f"WHERE id = (SELECT contact_id FROM crm_conversations WHERE id = {conv_id})"
            )
        if object_id:
            cur.execute(f"UPDATE crm_conversations SET object_id = {int(object_id)} WHERE id = {conv_id}")

        return resp(200, {'ok': True, 'conversationId': conv_id})

    if channel == 'max':
        msg = (payload.get('message') or {})
        sender = msg.get('sender') or payload.get('sender') or {}
        recipient = msg.get('recipient') or {}
        chat_id = recipient.get('chat_id') or payload.get('chat_id') or sender.get('user_id')
        text = ((msg.get('body') or {}).get('text')) or payload.get('text') or '[вложение]'
        if not chat_id:
            return resp(200, {'ok': True, 'skipped': 'no chat'})
        name = sender.get('name') or sender.get('username') or f'MAX {chat_id}'
        store_incoming(cur, 'max', str(chat_id), sender.get('username'),
                       name, text, str((msg.get('body') or {}).get('mid') or ''))
        return resp(200, {'ok': True})

    return resp(400, {'error': f'Неизвестный канал: {channel}'})


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Бизнес: CRM-центр общения — единый список диалогов из Telegram и MAX,
    история переписки, ответы менеджера, статусы и назначение ответственного.
    Args: event с httpMethod, queryStringParameters (action), body
    Returns: HTTP-ответ с JSON
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')

    body = {}
    if method in ('POST', 'PUT'):
        raw = event.get('body') or '{}'
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return resp(400, {'error': 'Некорректный JSON'})

    conn = get_conn()
    conn.autocommit = True
    cur = conn.cursor()
    try:
        if action == 'list':
            return handle_list(cur, params)
        if action == 'messages':
            return handle_messages(cur, params)
        if action == 'reply' and method == 'POST':
            return handle_reply(cur, body)
        if action == 'update' and method in ('POST', 'PUT'):
            return handle_update(cur, body)
        if action == 'create' and method == 'POST':
            return handle_create(cur, body)
        if action == 'webhook' and method == 'POST':
            return handle_webhook(cur, params.get('channel', 'telegram'), body)
        if action == 'managers':
            cur.execute("""
                SELECT id, name FROM users
                WHERE role IN ('admin', 'manager', 'broker') OR is_admin = true
                ORDER BY name
            """)
            return resp(200, [{'id': r[0], 'name': r[1]} for r in cur.fetchall()])
        return resp(400, {'error': f'Неизвестное действие: {action}'})
    finally:
        cur.close()
        conn.close()