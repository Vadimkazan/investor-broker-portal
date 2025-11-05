'''
Business: Telegram bot webhook handler - responds to /start with user's Chat ID
Args: event - dict with httpMethod, body containing Telegram webhook update
      context - object with attributes: request_id, function_name
Returns: HTTP response dict confirming message was sent
'''
import json
import os
import urllib.request
import urllib.error
from typing import Dict, Any

def send_telegram_message(chat_id: str, text: str, parse_mode: str = 'HTML') -> Dict[str, Any]:
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        raise ValueError('TELEGRAM_BOT_TOKEN not configured')
    
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': parse_mode
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f'Telegram API error: {error_body}')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        
        if 'message' not in body_data:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        message = body_data['message']
        chat_id = str(message['chat']['id'])
        text = message.get('text', '')
        
        if text == '/start':
            response_text = (
                f"👋 <b>Привет!</b>\n\n"
                f"Ваш Chat ID для подключения уведомлений:\n\n"
                f"<code>{chat_id}</code>\n\n"
                f"📋 Нажмите на номер, чтобы скопировать\n\n"
                f"Вставьте этот ID в настройках уведомлений на платформе Vozduh."
            )
            
            send_telegram_message(chat_id, response_text, 'HTML')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'ok': True})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
