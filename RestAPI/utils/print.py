from escpos.printer import Usb
from utils.log import LoggerManager

logger = LoggerManager().logger

LINE_WIDTH = 32  # 58mm paper; use 42 for 80mm


def _separator(char="-", width=LINE_WIDTH):
    return char * width + "\n"


def _two_col(left, right, width=LINE_WIDTH):
    right_str = str(right)
    left_max = width - len(right_str) - 1
    return left[:left_max].ljust(left_max) + " " + right_str + "\n"


class Printing():

    def __init__(self):
        self.printer = Usb(
            idVendor=0x0456,
            idProduct=0x0808,
            timeout=60,
            profile='TM-T88III',
            out_ep=0x03,
            in_ep=0x81,
        )

    def print(self, order, categories=None, station_name=None):
        """
        Print receipt grouped by category.
        categories: dict {category_id: category_name}
        station_name: str or None
        """
        try:
            p = self.printer
            order_id = str(order.get('_id', ''))
            short_id = order_id[-6:].upper() if order_id else "??????"
            cats = categories or {}

            # ── Header ──────────────────────────────────
            p.set(align='center', bold=True, double_height=True, double_width=False)
            p.text("BESTELLUNG\n")
            p.set(align='center', bold=False, double_height=False)

            if station_name:
                p.set(align='center', bold=True)
                p.text(f"{station_name}\n")
                p.set(bold=False)

            p.text(_separator("="))
            p.text(f"Nr: {short_id}\n")
            p.text(_separator("="))

            # ── Group items by category ──────────────────
            grouped: dict[str, list] = {}
            for item in order.get('orders', []):
                cat_id = item['product'].get('category', '')
                grouped.setdefault(cat_id, []).append(item)

            cat_ids = list(grouped.keys())
            for idx, cat_id in enumerate(cat_ids):
                cat_name = cats.get(cat_id, "Sonstiges")
                items = grouped[cat_id]

                # Category header
                p.set(align='center', bold=True)
                p.text(f"-- {cat_name} --\n")
                p.set(align='left', bold=False)

                for i, item in enumerate(items):
                    display_name = item['product'].get('shortName') or item['product']['name']
                    amount = item['amount']
                    p.set(bold=True)
                    p.text(_two_col(f"{amount} x {display_name}", ""))
                    p.set(bold=False)
                    # Thin separator between items (not after last item)
                    if i < len(items) - 1:
                        p.text(_separator("-"))

                # Thick separator between categories
                if idx < len(cat_ids) - 1:
                    p.text(_separator("="))
                else:
                    p.text(_separator("="))

            # ── Footer ───────────────────────────────────
            total_items = sum(i['amount'] for i in order.get('orders', []))
            p.set(bold=True, align='left')
            p.text(_two_col("GESAMT ARTIKEL", total_items))
            p.set(bold=False)
            p.text("\n")
            p.cut()
            p.close()
            return True
        except Exception as e:
            logger.error(f'Print error: {e}')
            return False

    def checkStatus(self):
        return self.printer.is_online()

    def __del__(self):
        pass
