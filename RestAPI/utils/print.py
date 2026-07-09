from escpos.printer import Usb
from utils.log import LoggerManager

logger = LoggerManager().logger


def _line_width(paper_width: str) -> int:
    return 42 if str(paper_width).strip() == '80' else 32


def _separator(char="-", width=32):
    return char * width + "\n"


def _two_col(left, right, width=32):
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

    def print(self, order, categories=None, station_name=None, bon_settings=None):
        """
        Print receipt grouped by category.
        categories: dict {category_id: category_name}
        station_name: str or None
        bon_settings: dict from settings_reader.get_bon_settings()
        """
        try:
            p = self.printer
            s = bon_settings or {}
            w = _line_width(s.get('paper_width', '58'))
            show_prices = str(s.get('show_prices', 'false')).lower() == 'true'
            footer_text = s.get('footer', '')
            business_name = s.get('name', '')
            address = s.get('address', '')

            order_id = str(order.get('_id', ''))
            short_id = order_id[-6:].upper() if order_id else "??????"
            cats = categories or {}

            # ── Header ──────────────────────────────────
            if business_name:
                p.set(align='center', bold=True, double_height=True)
                p.text(f"{business_name}\n")
                p.set(bold=False, double_height=False)
            if address:
                p.set(align='center')
                p.text(f"{address}\n")
            p.set(align='center', bold=True, double_height=True, double_width=False)
            p.text("BESTELLUNG\n")
            p.set(align='center', bold=False, double_height=False)

            if station_name:
                p.set(align='center', bold=True)
                p.text(f"{station_name}\n")
                p.set(bold=False)

            p.text(_separator("=", w))
            p.text(f"Nr: {short_id}\n")
            p.text(_separator("=", w))

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
                    price = item['product'].get('price', 0)

                    # Large, bold item — amount on its own line, name below
                    p.set(align='left', bold=True, custom_size=True, height=3, width=3)
                    p.text(f"{amount} x\n")
                    p.text(f"{display_name}\n")
                    # Zurück auf Normalgröße (width/height=1 statt normal_textsize,
                    # damit es auch mit älteren python-escpos-Versionen läuft)
                    p.set(align='left', bold=False, custom_size=True, height=1, width=1)

                    # Price on its own line (big font is too wide for a second column)
                    if show_prices:
                        p.set(align='right', bold=True, double_height=True)
                        p.text(f"{price * amount:.2f} EUR\n")
                        p.set(align='left', bold=False, double_height=False)

                    if i < len(items) - 1:
                        p.text(_separator("-", w))

                if idx < len(cat_ids) - 1:
                    p.text(_separator("=", w))
                else:
                    p.text(_separator("=", w))

            # ── Footer ───────────────────────────────────
            total_items = sum(i['amount'] for i in order.get('orders', []))
            p.set(align='left', bold=True, double_height=True)
            p.text(f"GESAMT: {total_items} Artikel\n")
            p.set(double_height=False)
            if show_prices:
                order_total = order.get('total', 0)
                p.set(align='left', bold=True, custom_size=True, height=2, width=2)
                p.text(f"{order_total:.2f} EUR\n")
                p.set(align='left', custom_size=True, height=1, width=1)
            p.set(bold=False)
            if footer_text:
                p.text(_separator("-", w))
                p.set(align='center')
                p.text(f"{footer_text}\n")
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
