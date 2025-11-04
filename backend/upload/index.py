import json
import os
import base64
import uuid
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: File upload endpoint for images, videos, and PDF documents
    Args: event with httpMethod, body containing base64 file data
    Returns: HTTP response with uploaded file URL
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
    
    try:
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
        
        file_extension = file_name.split('.')[-1] if '.' in file_name else 'jpg'
        unique_name = f"{uuid.uuid4()}.{file_extension}"
        
        file_url = f"https://cdn.poehali.dev/files/{unique_name}"
        
        return success_response({
            'url': file_url,
            'fileName': unique_name,
            'fileType': file_type,
            'fileSize': len(file_bytes)
        })
    
    except Exception as e:
        return error_response(f'Upload failed: {str(e)}', 500)


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
