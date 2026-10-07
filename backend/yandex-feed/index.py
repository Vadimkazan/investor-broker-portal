import os
import psycopg2
from xml.sax.saxutils import escape

SITE = 'https://xn--80aagkc8a6anj.xn--p1ai'
SCHEMA = 't_p80180089_investor_broker_port'

CATEGORY = {
    'apartments': 'квартира',
    'new_flat': 'квартира',
    'secondary_flat': 'квартира',
    'rooms': 'комната',
    'houses': 'дом',
    'land': 'участок',
    'land_development': 'участок',
}
COMMERCIAL = {'commercial', 'gab', 'buildings_redevelopment', 'parking', 'storage'}


def tag(name: str, value) -> str:
    if value is None or value == '':
        return ''
    return f"      <{name}>{escape(str(value))}</{name}>\n"


def handler(event: dict, context) -> dict:
    """YML-фид объектов для Яндекс Недвижимости: открытая ссылка без паролей"""
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
        f"SELECT o.id, o.title, o.city, o.address, o.property_type, o.area, o.price, "
        f"o.description, o.images, to_char(o.created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS+00:00'), "
        f"to_char(COALESCE(o.updated_at, o.created_at), 'YYYY-MM-DD\"T\"HH24:MI:SS+00:00'), "
        f"u.name, u.phone "
        f"FROM {SCHEMA}.investment_objects o "
        f"LEFT JOIN {SCHEMA}.users u ON o.broker_id = u.id "
        f"WHERE o.status = 'available' ORDER BY o.id"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    now = max([r[10] for r in rows if r[10]] or ['2026-01-01T00:00:00+00:00'])
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<realty-feed xmlns="http://webmaster.yandex.ru/schemas/feed/realty/2010-06">\n'
    xml += f"  <generation-date>{now}</generation-date>\n"

    for (oid, title, city, address, ptype, area, price, desc, images,
         created, updated, broker_name, broker_phone) in rows:
        commercial = ptype in COMMERCIAL
        xml += f'  <offer internal-id="{oid}">\n'
        xml += tag('type', 'продажа')
        if not commercial:
            xml += tag('property-type', 'жилая')
        xml += tag('category', 'commercial' if commercial else CATEGORY.get(ptype, 'квартира'))
        xml += tag('url', f'{SITE}/objects/{oid}')
        xml += tag('creation-date', created)
        xml += tag('last-update-date', updated)
        xml += '      <location>\n'
        xml += f"        <country>Россия</country>\n"
        xml += f"        <locality-name>{escape(city or '')}</locality-name>\n"
        xml += f"        <address>{escape(address or '')}</address>\n"
        xml += '      </location>\n'
        if broker_name or broker_phone:
            xml += '      <sales-agent>\n'
            xml += tag('name', broker_name)
            xml += tag('phone', broker_phone)
            xml += '      </sales-agent>\n'
        xml += '      <price>\n'
        xml += f"        <value>{int(price)}</value>\n        <currency>RUR</currency>\n"
        xml += '      </price>\n'
        if area:
            xml += f"      <area>\n        <value>{float(area)}</value>\n        <unit>кв. м</unit>\n      </area>\n"
        for img in (images or [])[:20]:
            xml += tag('image', img)
        xml += tag('description', desc or title)
        xml += '  </offer>\n'

    xml += '</realty-feed>\n'

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=900',
            'Access-Control-Allow-Origin': '*',
        },
        'body': xml,
    }
