import os
import psycopg2
from xml.sax.saxutils import escape

SITE = 'https://xn--80aagkc8a6anj.xn--p1ai'
SCHEMA = 't_p80180089_investor_broker_port'


def url_block(loc: str, lastmod: str, freq: str, priority: str) -> str:
    return (
        f"  <url>\n    <loc>{escape(loc)}</loc>\n    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{freq}</changefreq>\n    <priority>{priority}</priority>\n  </url>\n"
    )


def handler(event: dict, context) -> dict:
    """Динамическая карта сайта: главная, каталог и все объекты с актуальными датами"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, to_char(COALESCE(updated_at, created_at), 'YYYY-MM-DD') "
        f"FROM {SCHEMA}.investment_objects WHERE status = 'available' ORDER BY id"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    latest = max([r[1] for r in rows if r[1]] or ['2026-01-01'])
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += url_block(f'{SITE}/', latest, 'daily', '1.0')
    xml += url_block(f'{SITE}/objects', latest, 'daily', '0.9')
    for obj_id, lastmod in rows:
        xml += url_block(f'{SITE}/objects/{obj_id}', lastmod or latest, 'weekly', '0.8')
    xml += '</urlset>\n'

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=900',
            'Access-Control-Allow-Origin': '*',
        },
        'body': xml,
    }
