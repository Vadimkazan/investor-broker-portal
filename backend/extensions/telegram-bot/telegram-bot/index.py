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


def handle_start(chat_id: int) -> None:
    """Обработка команды /start без параметров."""
    bot = get_bot()
    bot.send_message(chat_id, "Привет! Используйте кнопку «Войти через Telegram» на сайте.")


def process_webhook(body: dict) -> dict:
    """Обработка webhook от Telegram."""
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
            if len(parts) > 1 and parts[1] == "web_auth":
                handle_web_auth(chat_id, user)
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


def handle_test(body: dict) -> dict:
    """
    POST ?action=test
    Send test message to verify configuration.
    """
    chat_id = body.get("chat_id") or get_default_chat_id()

    if not chat_id:
        return cors_response(400, {"error": "chat_id is required"})

    text = f"""<b>Тестовое сообщение</b>

Если вы видите это сообщение — Telegram-бот настроен правильно!

<i>Время: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</i>"""

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

        elif action == "debug-secret":
            out = {}
            for key in ["TELEGRAM_AUTH_WEBHOOK_SECRET", "TELEGRAM_AUTH_BOT_TOKEN", "TELEGRAM_AUTH_BOT_USERNAME", "SITE_URL"]:
                v = os.environ.get(key, "")
                out[key] = {"len": len(v), "prefix": v[:8], "suffix": v[-6:] if len(v) >= 6 else v}
            return cors_response(200, out)
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