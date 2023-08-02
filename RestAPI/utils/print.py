from escpos.printer import Network, Dummy
from escpos import image
from PIL import Image, ImageOps
from utils.log import LoggerManager


test = {
    '_id': "123123",
    "orders": [
        {"id": 1, "product": {"id": "64c3bcc5f0e76b4c0cb1a0a7", "name": "name of the product"}, "amount" : 0},
        {"id": 2, "product": {"id": "64c3bcc5f0e76b4c0cb1a0a7", "name": "name of the product"}, "amount" : 2}
                ]
}

logger = LoggerManager().logger


class Printing():

    def __init__(self):
        logger.debug("Connecting to printer")
        self.printer = Network("10.0.1.180")
        self.logo = "./logo.png"


    def print(self,order):
        try:
            self.order = order
            self.orderId = str(self.order['_id'])
            logger.debug(f"Got order with id {self.orderId} that should be printed")
            for i in self.order['orders']:
                self.printer.image(self.logo)
                self.printer.text(f"{i['product']['name']}")
                self.printer.text(f"{i['amount']}")
                self.printer.barcode('4006381333931', 'EAN13', 64, 2, '', '')
                self.printer.text("Hallo Nadja, wie geht es dir!")
                self.printer.cut()
            return True
        except Exception as e:
            logger.error(f'Got the following error: {e}')
            return False


    def checkStatus(self):
        return self.printer.is_online()