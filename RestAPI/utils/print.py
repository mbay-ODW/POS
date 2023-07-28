from escpos.printer import Network, Dummy
from PIL import Image
from io import BytesIO
import logging
from utils.database import Database


test = {
    '_id': "123123",
    "orders": [
        {"id": 1, "product": {"id": "64c3bcc5f0e76b4c0cb1a0a7", "name": "name of the product"}, "amount" : 0},
        {"id": 2, "product": {"id": "64c3bcc5f0e76b4c0cb1a0a7", "name": "name of the product"}, "amount" : 2}
                ]
}

logger = logging.getLogger('__main__.' + __name__)


def printing(order):
    try:
        orderId = str(order['_id'])
        logger.error(f"Got order with id {orderId} that should be printed")
        logger.error("Connecting to printer")
        printer = Network("10.0.1.8")
        #printer = Dummy()
        logo_path = "./logo.png"
        logo_image = Image.open(logo_path)
        logo_image = logo_image.convert("1")  # Convert to monochrome (1-bit image)
        for i in order['orders']:
            printer.image(logo_image)
            printer.text(f"{i['product']['name']}")
            printer.text(f"{i['amount']}")
            printer.barcode(f'{orderId}','EAN13',64,2,'','')
            printer.cut()
    except Exception as e:
        logger.error(f'Got the following error: {e}')

printing(test)