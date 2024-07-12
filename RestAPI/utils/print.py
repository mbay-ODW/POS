from escpos.printer import Network, Dummy, Usb, Serial
from escpos import image
from PIL import Image, ImageOps
from utils.log import LoggerManager


test_order = {
    '_id': "123123",
    "orders": [
        {"id": 1, "product": {"id": "64c3bcc5f0e76b4c0cb1a0a7", "name": "Kuchen"}, "amount" : 0},
        {"id": 2, "product": {"id": "64c3bcc5f0e76b4c0cb1a0a7", "name": "Wurst"}, "amount" : 2}
                ]
}

logger = LoggerManager().logger


class Printing():

    def __init__(self):
        self.printer = Usb(0x0456, 0x0808, timeout=60,profile="TM-T88III",out_ep=3)


    def print(self,order):
        try:
            logger.debug("Printing oder")
            self.order = order
            logger.debug(self.order)
            self.orderId = str(self.order['_id'])
            for i in self.order['orders']:
                #self.printer.image(self.logo)
                self.printer.text(f"{i['product']['name']} x ")
                self.printer.text(f"{i['amount']}\n")
                self.printer.text("--------------------")
                self.printer.cut()
            return True
        except Exception as e:
            #logger.error(f'Got the following error: {e}')
            print(e)
            return False


    def checkStatus(self):
        return self.printer.is_online()
    

# if __name__ == "__main__":
#     test = Printing()
#     print(test.checkStatus())
#     if test.checkStatus():
#         test.print(test_order)
#     else:
#         print("Not ready")