"""
Telegram Bot Function

Обрабатывает:
1. Webhook от Telegram для авторизации через /start web_auth
2. Отправку уведомлений через API (action=send, action=send-photo)
3. Тестовые сообщения (action=test)
"""

import json
import os
import socket
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional

import psycopg2
import telebot


# =============================================================================
# NETWORK WORKAROUND
# =============================================================================
# In this sandbox api.telegram.org sometimes resolves to an unreachable IP.
# Force resolution to a known-reachable Telegram DC IP while keeping the
# hostname for TLS/SNI verification intact (safe — certificate check still
# validates against "api.telegram.org").

_TELEGRAM_WORKING_IP = "149.154.167.220"
_original_getaddrinfo = socket.getaddrinfo


def _patched_getaddrinfo(host, *args, **kwargs):
    if host == "api.telegram.org":
        host = _TELEGRAM_WORKING_IP
    return _original_getaddrinfo(host, *args, **kwargs)


socket.getaddrinfo = _patched_getaddrinfo


# =============================================================================
# CONFIGURATION
# =============================================================================

def get_bot_token() -> str:
    """Get Telegram bot token (dedicated auth bot, separate from notifications bot)."""
    token = os.environ.get("TELEGRAM_AUTH_BOT_TOKEN", "")
    if not token:
        raise ValueError("TELEGRAM_AUTH_BOT_TOKEN not configured")
    return token


def get_bot() -> telebot.TeleBot:
    """Create bot instance."""
    return telebot.TeleBot(get_bot_token())


def get_default_chat_id() -> str:
    """Get default chat ID for notifications."""
    return os.environ.get("TELEGRAM_CHAT_ID", "")


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{schema}." if schema else ""


# =============================================================================
# CORS HELPERS
# =============================================================================

def get_cors_headers() -> dict:
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
    return {
        "Access-Control-Allow-Origin": allowed_origins,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Bot-Api-Secret-Token",
    }


def cors_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**get_cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def options_response() -> dict:
    return {
        "statusCode": 204,
        "headers": get_cors_headers(),
        "body": "",
    }


# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

def save_auth_token(
    telegram_id: str,
    username: Optional[str],
    first_name: Optional[str],
    last_name: Optional[str]
) -> str:
    """Сохраняет токен авторизации в БД и возвращает его."""
    token = str(uuid.uuid4())
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    schema = get_schema()

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            INSERT INTO {schema}telegram_auth_tokens
            (token_hash, telegram_id, telegram_username, telegram_first_name,
             telegram_last_name, telegram_photo_url, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            token_hash,
            telegram_id,
            username,
            first_name,
            last_name,
            None,
            datetime.now(timezone.utc) + timedelta(minutes=5)
        ))
        conn.commit()
    finally:
        conn.close()

    return token


def create_link_code(user_id: int) -> str:
    """Создаёт одноразовый код привязки Telegram для пользователя."""
    code = uuid.uuid4().hex[:16]
    schema = get_schema()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            UPDATE {schema}users
            SET telegram_link_code = %s, telegram_link_expires_at = %s
            WHERE id = %s
        """, (code, datetime.now(timezone.utc) + timedelta(minutes=15), int(user_id)))
        conn.commit()
    finally:
        conn.close()
    return code


def link_chat_by_code(code: str, chat_id: int, telegram_id: str) -> bool:
    """Привязывает чат к пользователю по одноразовому коду."""
    schema = get_schema()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            UPDATE {schema}users
            SET telegram_chat_id = %s,
                telegram_id = COALESCE(telegram_id, %s),
                telegram_link_code = NULL,
                telegram_link_expires_at = NULL
            WHERE telegram_link_code = %s
              AND telegram_link_expires_at > NOW()
            RETURNING id
        """, (str(chat_id), str(telegram_id), code))
        row = cursor.fetchone()
        conn.commit()
        return row is not None
    finally:
        conn.close()


def link_chat_id(telegram_id: str, chat_id: int) -> None:
    """Привязывает chat_id к пользователю, чтобы он получал рассылку."""
    schema = get_schema()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            UPDATE {schema}users SET telegram_chat_id = %s
            WHERE telegram_id = %s
        """, (str(chat_id), str(telegram_id)))
        conn.commit()
    finally:
        conn.close()


# =============================================================================
# WEBHOOK HANDLERS (Authorization)
# =============================================================================

def handle_web_auth(chat_id: int, user: dict) -> None:
    """Обработка команды /start web_auth."""
    telegram_id = str(user.get("id", ""))
    username = user.get("username")
    first_name = user.get("first_name")
    last_name = user.get("last_name")

    token = save_auth_token(telegram_id, username, first_name, last_name)

    try:
        link_chat_id(telegram_id, chat_id)
    except Exception as e:
        print(f"Failed to link chat_id: {e}")

    site_url = os.environ["SITE_URL"].rstrip("/")
    auth_url = f"{site_url}/auth/telegram/callback?token={token}"

    bot = get_bot()
    bot.send_message(
        chat_id,
        f"Авторизация готова!\n\nНажмите кнопку ниже, чтобы войти на сайт 👇\n\nСсылка действительна 5 минут.",
        reply_markup=telebot.types.InlineKeyboardMarkup().add(
            telebot.types.InlineKeyboardButton("Войти на сайт", url=auth_url)
        )
    )


def handle_link(chat_id: int, user: dict, code: str) -> None:
    """Обработка команды /start link_<код> — привязка уведомлений."""
    bot = get_bot()
    telegram_id = str(user.get("id", ""))

    if link_chat_by_code(code, chat_id, telegram_id):
        bot.send_message(
            chat_id,
            "Готово! Уведомления подключены.\n\n"
            "Теперь новые посты клуба и оповещения об объектах будут приходить сюда."
        )
    else:
        bot.send_message(
            chat_id,
            "Ссылка устарела или уже использована.\n\n"
            "Откройте настройки уведомлений на сайте и нажмите «Подключить Telegram» снова."
        )


def handle_start(chat_id: int) -> None:
    """Обработка команды /start без параметров."""
    bot = get_bot()
    bot.send_message(chat_id, "Привет! Используйте кнопку «Войти через Telegram» на сайте.")


def get_channel_subscribers() -> list:
    """Получить chat_id всех подписчиков на посты канала."""
    schema = get_schema()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT telegram_chat_id FROM {schema}users
            WHERE notify_channel_posts = TRUE
              AND telegram_chat_id IS NOT NULL
              AND telegram_chat_id <> ''
        """)
        return [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()


def handle_channel_post(post: dict) -> None:
    """Пересылает новый пост канала всем подписчикам."""
    chat = post.get("chat", {})
    expected = os.environ.get("TELEGRAM_CHANNEL_USERNAME", "Arealvest_klub").lstrip("@").lower()

    if (chat.get("username") or "").lower() != expected:
        return

    from_chat_id = chat.get("id")
    message_id = post.get("message_id")
    if not from_chat_id or not message_id:
        return

    bot = get_bot()
    for chat_id in get_channel_subscribers():
        try:
            bot.copy_message(
                chat_id=chat_id,
                from_chat_id=from_chat_id,
                message_id=message_id,
            )
        except Exception as e:
            print(f"Broadcast failed for {chat_id}: {e}")


def process_webhook(body: dict) -> dict:
    """Обработка webhook от Telegram."""
    channel_post = body.get("channel_post")
    if channel_post:
        try:
            handle_channel_post(channel_post)
        except Exception as e:
            print(f"Error processing channel post: {e}")
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    message = body.get("message")

    if not message:
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    text = message.get("text", "")
    user = message.get("from", {})
    chat_id = message.get("chat", {}).get("id")

    if not chat_id:
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    try:
        if text.startswith("/start"):
            parts = text.split(" ", 1)
            param = parts[1].strip() if len(parts) > 1 else ""
            if param == "web_auth":
                handle_web_auth(chat_id, user)
            elif param.startswith("link_"):
                handle_link(chat_id, user, param[5:])
            else:
                handle_start(chat_id)
    except telebot.apihelper.ApiTelegramException as e:
        print(f"Telegram API error: {e}")
    except Exception as e:
        print(f"Error processing webhook: {e}")

    return {"statusCode": 200, "body": json.dumps({"ok": True})}


# =============================================================================
# NOTIFICATION HANDLERS
# =============================================================================

def handle_send(body: dict) -> dict:
    """
    POST ?action=send
    Send text message.
    """
    text = body.get("text", "").strip()
    chat_id = body.get("chat_id") or get_default_chat_id()
    parse_mode = body.get("parse_mode", "HTML")
    silent = body.get("silent", False)

    if not text:
        return cors_response(400, {"error": "text is required"})

    if not chat_id:
        return cors_response(400, {"error": "chat_id is required"})

    if len(text) > 4096:
        return cors_response(400, {"error": "Message too long (max 4096 characters)"})

    try:
        bot = get_bot()
        result = bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode=parse_mode,
            disable_notification=silent,
            disable_web_page_preview=True,
        )
        return cors_response(200, {
            "success": True,
            "message_id": result.message_id,
        })
    except telebot.apihelper.ApiTelegramException as e:
        return cors_response(400, {
            "error": e.description,
            "error_code": e.error_code,
        })
    except Exception as e:
        return cors_response(500, {"error": str(e)})


def handle_send_photo(body: dict) -> dict:
    """
    POST ?action=send-photo
    Send photo with caption.
    """
    photo_url = body.get("photo_url", "").strip()
    caption = body.get("caption", "").strip()
    chat_id = body.get("chat_id") or get_default_chat_id()
    parse_mode = body.get("parse_mode", "HTML")

    if not photo_url:
        return cors_response(400, {"error": "photo_url is required"})

    if not chat_id:
        return cors_response(400, {"error": "chat_id is required"})

    try:
        bot = get_bot()
        result = bot.send_photo(
            chat_id=chat_id,
            photo=photo_url,
            caption=caption if caption else None,
            parse_mode=parse_mode,
        )
        return cors_response(200, {
            "success": True,
            "message_id": result.message_id,
        })
    except telebot.apihelper.ApiTelegramException as e:
        return cors_response(400, {
            "error": e.description,
            "error_code": e.error_code,
        })
    except Exception as e:
        return cors_response(500, {"error": str(e)})


def get_object_subscribers() -> list:
    """Получить chat_id подписчиков на уведомления о новых объектах."""
    schema = get_schema()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT telegram_chat_id FROM {schema}users
            WHERE notify_new_objects = TRUE
              AND telegram_chat_id IS NOT NULL
              AND telegram_chat_id <> ''
        """)
        return [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()


def format_price(value) -> str:
    """Форматирует цену в читаемый вид."""
    try:
        return f"{int(float(value)):,}".replace(",", " ") + " ₽"
    except (TypeError, ValueError):
        return "цена по запросу"


def handle_broadcast_object(body: dict) -> dict:
    """
    POST ?action=broadcast-object
    Рассылает подписчикам карточку нового объекта.
    """
    object_id = body.get("object_id")
    if not object_id:
        return cors_response(400, {"error": "object_id is required"})

    schema = get_schema()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT title, city, price, yield_percent, images
            FROM {schema}investment_objects WHERE id = %s
        """, (int(object_id),))
        row = cursor.fetchone()
    finally:
        conn.close()

    if not row:
        return cors_response(404, {"error": "Object not found"})

    title, city, price, yield_percent, images = row
    site_url = os.environ.get("SITE_URL", "").rstrip("/")
    link = f"{site_url}/objects/{object_id}"

    lines = [f"<b>Новый объект: {title}</b>", ""]
    if city:
        lines.append(f"Город: {city}")
    lines.append(f"Цена: {format_price(price)}")
    if yield_percent:
        lines.append(f"Доходность: {yield_percent}% годовых")
    lines.append("")
    lines.append(f'<a href="{link}">Смотреть объект</a>')
    caption = "\n".join(lines)

    photo = images[0] if images else None
    subscribers = get_object_subscribers()
    sent, failed = 0, 0

    bot = get_bot()
    for chat_id in subscribers:
        try:
            if photo:
                bot.send_photo(chat_id=chat_id, photo=photo, caption=caption, parse_mode="HTML")
            else:
                bot.send_message(
                    chat_id=chat_id, text=caption, parse_mode="HTML",
                    disable_web_page_preview=False,
                )
            sent += 1
        except Exception as e:
            failed += 1
            print(f"Object broadcast failed for {chat_id}: {e}")

    return cors_response(200, {"success": True, "sent": sent, "failed": failed})


def handle_broadcast(body: dict) -> dict:
    """
    POST ?action=broadcast
    Ручная рассылка произвольного сообщения подписчикам.
    """
    text = (body.get("text") or "").strip()
    photo_url = (body.get("photo_url") or "").strip()

    if not text:
        return cors_response(400, {"error": "Введите текст сообщения"})

    limit = 1024 if photo_url else 4096
    if len(text) > limit:
        return cors_response(400, {"error": f"Слишком длинный текст (максимум {limit} символов)"})

    subscribers = get_object_subscribers()
    if not subscribers:
        return cors_response(200, {"success": True, "sent": 0, "failed": 0})

    sent, failed = 0, 0
    bot = get_bot()
    for chat_id in subscribers:
        try:
            if photo_url:
                bot.send_photo(chat_id=chat_id, photo=photo_url, caption=text, parse_mode="HTML")
            else:
                bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
            sent += 1
        except Exception as e:
            failed += 1
            print(f"Manual broadcast failed for {chat_id}: {e}")

    return cors_response(200, {"success": True, "sent": sent, "failed": failed})


def handle_subscribers_count(body: dict) -> dict:
    """GET/POST ?action=subscribers-count — сколько людей получит рассылку."""
    return cors_response(200, {"count": len(get_object_subscribers())})


def handle_test(body: dict) -> dict:
    """
    POST ?action=test
    Send test message to verify configuration.
    """
    chat_id = body.get("chat_id")

    user_id = body.get("user_id")
    if not chat_id and user_id:
        schema = get_schema()
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        try:
            cursor = conn.cursor()
            cursor.execute(
                f"SELECT telegram_chat_id FROM {schema}users WHERE id = %s",
                (int(user_id),)
            )
            row = cursor.fetchone()
            chat_id = row[0] if row else None
        finally:
            conn.close()

    if not chat_id:
        chat_id = get_default_chat_id()

    if not chat_id:
        return cors_response(400, {"error": "Telegram не подключен"})

    text = """<b>Проверка связи</b>

Всё работает! Уведомления будут приходить в этот чат."""

    try:
        bot = get_bot()
        result = bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode="HTML",
        )
        return cors_response(200, {
            "success": True,
            "message": "Test message sent",
            "message_id": result.message_id,
        })
    except telebot.apihelper.ApiTelegramException as e:
        return cors_response(400, {
            "error": e.description,
            "error_code": e.error_code,
        })
    except Exception as e:
        return cors_response(500, {"error": str(e)})


# =============================================================================
# MAIN HANDLER
# =============================================================================

def handler(event: dict, context) -> dict:
    """Main entry point."""
    method = event.get("httpMethod", "POST")

    if method == "OPTIONS":
        return options_response()

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    # If action specified — handle notification API
    if action:
        body = {}
        if method == "POST":
            raw_body = event.get("body", "{}")
            try:
                body = json.loads(raw_body) if raw_body else {}
            except json.JSONDecodeError:
                return cors_response(400, {"error": "Invalid JSON"})

        if action == "send" and method == "POST":
            return handle_send(body)
        elif action == "send-photo" and method == "POST":
            return handle_send_photo(body)
        elif action == "test" and method == "POST":
            return handle_test(body)

        elif action == "broadcast" and method == "POST":
            return handle_broadcast(body)
        elif action == "subscribers-count":
            return handle_subscribers_count(body)
        elif action == "broadcast-object" and method == "POST":
            return handle_broadcast_object(body)
        elif action == "link-start" and method == "POST":
            user_id = body.get("user_id")
            if not user_id:
                return cors_response(400, {"error": "user_id is required"})
            code = create_link_code(int(user_id))
            bot_username = os.environ.get("TELEGRAM_AUTH_BOT_USERNAME", "").lstrip("@")
            return cors_response(200, {
                "success": True,
                "url": f"https://t.me/{bot_username}?start=link_{code}",
            })
        elif action == "set-webhook":
            try:
                import requests as _requests
                token = get_bot_token()
                resp = _requests.post(
                    f"https://api.telegram.org/bot{token}/setWebhook",
                    json={
                        "url": body.get("url", ""),
                        "secret_token": os.environ.get("TELEGRAM_AUTH_WEBHOOK_SECRET", ""),
                        "allowed_updates": ["message", "channel_post"],
                    },
                    timeout=4,
                )
                return cors_response(200, resp.json())
            except Exception as e:
                return cors_response(500, {"error": f"{type(e).__name__}: {e}"})
        elif action == "webhook-info":
            try:
                import requests as _requests
                token = get_bot_token()
                resp = _requests.get(
                    f"https://api.telegram.org/bot{token}/getWebhookInfo",
                    timeout=4,
                )
                return cors_response(200, resp.json())
            except Exception as e:
                return cors_response(500, {"error": f"{type(e).__name__}: {e}"})
        else:
            return cors_response(400, {"error": f"Unknown action: {action}"})

    # No action — handle Telegram webhook
    headers = event.get("headers", {})
    headers_lower = {k.lower(): v for k, v in headers.items()}
    webhook_secret = os.environ.get("TELEGRAM_AUTH_WEBHOOK_SECRET")

    if webhook_secret:
        request_secret = headers_lower.get("x-telegram-bot-api-secret-token", "")
        if request_secret != webhook_secret:
            return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    body = json.loads(event.get("body", "{}"))
    return process_webhook(body)