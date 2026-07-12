import os
from flask_restx import Resource
from flask import jsonify, make_response, request
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from utils.database import Database
from utils.log import LoggerManager
from utils.documents import log

# Zeitzone für die Auswertung. Buchungen liegen in UTC in der DB;
# Stunde/Tag/Wochentag werden für die Statistik in diese Zone umgerechnet.
STATS_TZ = os.getenv("STATS_TIMEZONE", "Europe/Berlin")


class Statistics(Resource):
    logger = LoggerManager().logger

    def __init__(self, api=None, *args, **kwargs):
        self.Database = Database.get_instance()
        self.orders = self.Database.db.orders
        self.stations = self.Database.db.stations

    @log
    def get(self, *args, **kwargs):
        try:
            # ── Parse filters ────────────────────────────────────────────
            station_id = request.args.get('station_id')
            from_str = request.args.get('from')
            to_str = request.args.get('to')

            product_id = request.args.get('product_id')

            match = {}
            if station_id:
                match['station_id'] = station_id
            if from_str or to_str:
                time_filter = {}
                if from_str:
                    time_filter['$gte'] = datetime.fromisoformat(from_str.replace('Z', '+00:00'))
                if to_str:
                    time_filter['$lte'] = datetime.fromisoformat(to_str.replace('Z', '+00:00'))
                match['creationTime'] = time_filter

            # Für Stunde/Tag/Heatmap zusätzlich nach Produkt filterbar
            # (zeigt, WANN ein bestimmtes Produkt gut lief).
            time_match = dict(match)
            if product_id:
                time_match['orders.product.id'] = product_id

            # ── Orders by hour of day ────────────────────────────────────
            orders_by_hour = list(self.orders.aggregate([
                {'$match': time_match},
                {'$group': {
                    '_id': {'$hour': {'date': '$creationTime', 'timezone': STATS_TZ}},
                    'count': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]))
            hours = {i: 0 for i in range(24)}
            for entry in orders_by_hour:
                hours[entry['_id']] = entry['count']

            # ── Orders by day ────────────────────────────────────────────
            orders_by_day = list(self.orders.aggregate([
                {'$match': time_match},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$creationTime', 'timezone': STATS_TZ}},
                    'count': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]))

            # ── Heatmap: weekday × hour ───────────────────────────────────
            # $dayOfWeek: 1=Sun … 7=Sat → remap to 0=Mon … 6=Sun
            heatmap_raw = list(self.orders.aggregate([
                {'$match': time_match},
                {'$group': {
                    '_id': {
                        'weekday': {'$dayOfWeek': {'date': '$creationTime', 'timezone': STATS_TZ}},
                        'hour': {'$hour': {'date': '$creationTime', 'timezone': STATS_TZ}}
                    },
                    'count': {'$sum': 1}
                }}
            ]))
            heatmap = []
            for entry in heatmap_raw:
                dow = (entry['_id']['weekday'] - 2) % 7  # 0=Mon
                heatmap.append({
                    'weekday': dow,
                    'hour': entry['_id']['hour'],
                    'count': entry['count']
                })

            # ── Products totals ───────────────────────────────────────────
            # Gruppierung nach Produkt-ID (nicht Name!), damit ein umbenanntes
            # Produkt nicht doppelt auftaucht. Aktueller Name wird danach aus
            # der products-Collection aufgelöst.
            products_totals = list(self.orders.aggregate([
                {'$match': match},
                {'$unwind': '$orders'},
                {'$group': {
                    '_id': '$orders.product.id',
                    'total_amount': {'$sum': '$orders.amount'},
                    'total_revenue': {'$sum': {'$multiply': ['$orders.product.price', '$orders.amount']}},
                    'order_ids': {'$addToSet': '$_id'},
                    'fallback_name': {'$first': '$orders.product.name'},
                    'fallback_short': {'$first': '$orders.product.shortName'},
                }},
                {'$sort': {'total_amount': -1}},
            ]))
            # Aktuelle Namen auflösen
            prod_ids = [p['_id'] for p in products_totals if p['_id']]
            name_map = {}
            if prod_ids:
                try:
                    for pr in self.Database.db.products.find(
                        {'_id': {'$in': [ObjectId(pid) for pid in prod_ids if pid]}}
                    ):
                        name_map[str(pr['_id'])] = pr.get('shortName') or pr.get('name')
                except Exception:
                    pass
            products = [
                {
                    'id': p['_id'],
                    'name': name_map.get(str(p['_id']), p.get('fallback_short') or p.get('fallback_name') or 'Unbekannt'),
                    'total_amount': p['total_amount'],
                    'order_count': len(p.get('order_ids', [])),
                    'total_revenue': round(p['total_revenue'], 2)
                }
                for p in products_totals
            ]

            # ── Station totals ─────────────────────────────────────────────
            station_pipeline = [
                {'$match': match},
                {'$group': {
                    '_id': '$station_id',
                    'order_count': {'$sum': 1},
                    'total_revenue': {'$sum': '$total'}
                }},
                {'$sort': {'order_count': -1}}
            ]
            station_raw = list(self.orders.aggregate(station_pipeline))
            # Resolve station names
            station_ids = [s['_id'] for s in station_raw if s['_id']]
            station_map = {}
            if station_ids:
                try:
                    for st in self.stations.find({'_id': {'$in': [ObjectId(sid) for sid in station_ids if sid]}}):
                        station_map[str(st['_id'])] = st['name']
                except Exception:
                    pass
            stations_out = [
                {
                    'station_id': s['_id'],
                    'name': station_map.get(s['_id'], s['_id'] or 'Unbekannt'),
                    'order_count': s['order_count'],
                    'total_revenue': round(s['total_revenue'] or 0, 2)
                }
                for s in station_raw
            ]

            # ── Summary ─────────────────────────────────────────────────
            total_orders = self.orders.count_documents(match)
            total_revenue_agg = list(self.orders.aggregate([
                {'$match': match},
                {'$group': {'_id': None, 'total': {'$sum': '$total'}}}
            ]))
            total_revenue = round(total_revenue_agg[0]['total'], 2) if total_revenue_agg else 0

            return make_response(jsonify({
                'summary': {
                    'total_orders': total_orders,
                    'total_revenue': total_revenue,
                },
                'orders_by_hour': [{'hour': h, 'count': c} for h, c in hours.items()],
                'orders_by_day': [{'date': d['_id'], 'count': d['count']} for d in orders_by_day],
                'heatmap': heatmap,
                'products': products,
                'stations': stations_out,
            }), 200)

        except Exception as e:
            self.logger.error(f'Statistics error: {e}')
            return make_response(jsonify({'message': str(e)}), 500)
