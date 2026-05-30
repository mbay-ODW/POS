"""Read settings from MongoDB with fallback defaults."""


DEFAULTS = {
    'bon.name':        '',
    'bon.address':     '',
    'bon.footer':      'Danke für Ihren Besuch!',
    'bon.paper_width': '58',
    'bon.show_prices': 'false',
    'bon.copies':      '1',
    'bon.logo':        '',
}


def get(db, key: str) -> str:
    doc = db.settings.find_one({'name': key})
    if doc:
        return doc.get('value', DEFAULTS.get(key, ''))
    return DEFAULTS.get(key, '')


def get_bon_settings(db) -> dict:
    return {k.split('.')[1]: get(db, k) for k in DEFAULTS}
