import json
import os
import base64
import uuid
import boto3
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Загрузка файлов (фото объектов) в S3 хранилище
    Args: event с httpMethod, body содержащим base64 файл, fileName, fileType
    Returns: HTTP response с публичным URL загруженного файла
    '''
    method: str = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return error_response('Method not allowed', 405)

    body = json.loads(event.get('body', '{}'))
    file_data = body.get('file')
    file_name = body.get('fileName', 'upload')
    file_type = body.get('fileType', 'image/jpeg')

    if not file_data:
        return error_response('File data is required', 400)

    allowed_types = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf'
    ]

    if file_type not in allowed_types:
        return error_response(f'File type {file_type} not allowed', 400)

    if file_data.startswith('data:'):
        file_data = file_data.split(',')[1]

    file_bytes = base64.b64decode(file_data)

    max_size = 50 * 1024 * 1024
    if len(file_bytes) > max_size:
        return error_response('File size exceeds 50MB limit', 400)

    file_extension = file_name.split('.')[-1].lower() if '.' in file_name else 'jpg'
    unique_name = f"objects/{uuid.uuid4()}.{file_extension}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    s3.put_object(
        Bucket='files',
        Key=unique_name,
        Body=file_bytes,
        ContentType=file_type
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_name}"

    return success_response({
        'url': cdn_url,
        'fileName': unique_name,
        'fileType': file_type,
        'fileSize': len(file_bytes)
    })


def success_response(data: Any, status_code: int = 200) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data),
        'isBase64Encoded': False
    }


def error_response(message: str, status_code: int = 400) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
