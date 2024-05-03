from pymongo.operations import UpdateOne,InsertOne,ReplaceOne
from bson import ObjectId, Timestamp
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os

db_cert = os.getenv("DATABASE_CERT_FILE", default="./dev-X509-cert.pem")
db_host = os.getenv('DATABASE_HOST',"mongodb://127.0.0.1:27017")
db_name = os.getenv('DATABASE_NAME',"Case")
db_cert = "dev-X509-cert.pem"

client = MongoClient(host=f'{db_host}?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority',tls=True,tlsCertificateKeyFile=f'{db_cert}',server_api=ServerApi('1'),serverSelectionTimeoutMS=1000, socketTimeoutMS=1000, )
db = client[db_name]
collection_names = ['users', 'categories', 'costUnits', 'files', 'cases', 'bookings', 'diaries', 'notes','groups', 'meetings']
for collection_name in collection_names:
    collection = db[collection_name]
    collection.delete_many({})

user = {}

user['name'] = "Max@example.com"

DatabaseConnector = db.users
id = DatabaseConnector.insert_one(user)
userID = id.inserted_id

category = {}

category['shortName'] = "L1 - Testing"
category['description'] = "This is a testing des"

DatabaseConnector = db.categories
id = DatabaseConnector.insert_one(category)
categoryID = id.inserted_id

costUnit = {}

costUnit['shortName'] = "Hessen"
costUnit['description'] = "This is a test cost-unit"

DatabaseConnector = db.costUnits
id = DatabaseConnector.insert_one(costUnit)
costUnitID = id.inserted_id

file = {}
file['name'] = "test.pdf"
file['data'] = "data:application/pdf:base64,asfasf"

DatabaseConnector = db.files
id = DatabaseConnector.insert_one(file)
fileID = id.inserted_id

case = {}
address = {}

address['street'] = "Hauptweg"
address['number'] = "1"
address['zip'] = "00000"
address['city'] = "Hauptstadt"

case['first_name'] = "Erika"
case['family_name'] = "Muster"
case['reference'] = "2341624vjh3476g31vgh34"
case['cost_unit'] = ObjectId(costUnitID)
case['active'] = "true" 
case['address'] = address
case['files'] = [{"id": ObjectId(fileID), "name": "test.pdf"}] 
case['periods'] = [{"start": "2023-01-01", "end": "2023-12-31", "amount": "100", "file": ObjectId(fileID)}]

DatabaseConnector = db.cases
id = DatabaseConnector.insert_one(case)
caseID = id.inserted_id

booking = {}
booking['category'] = ObjectId(categoryID)
booking['duration'] = "30"
booking['case'] = ObjectId(caseID)
booking['locked'] = "false"
booking['date'] = "2023-12-12"
booking['issuer'] = "Max@example.com"

DatabaseConnector = db.bookings
id = DatabaseConnector.insert_one(booking)
bookingID = id.inserted_id

diary = {}
entry = {}
entry['comment'] = "Thats a comment"
entry['mood'] = "Thats a mood"
entry['activity'] = "Thats an activity"
entry['consume'] = "Thats a consume"
entry['date'] = "2023-12-12"

diary['issuer'] = "Max@example.com"
diary['case'] = ObjectId(caseID)
diary['entry'] = entry

DatabaseConnector = db.diaries
id = DatabaseConnector.insert_one(diary)
diaryID = id.inserted_id

note = {}
note['issuer'] = "Max@example.com"
note['date'] = "2023-12-12"
note['comment'] = "Thats a comment"
note['case'] = ObjectId(caseID)

DatabaseConnector = db.notes
id = DatabaseConnector.insert_one(note)
noteID = id.inserted_id

audit = {}

group = {}
group['shortName'] = "Sport"
group['description'] = "Test"

DatabaseConnector = db.groups
id = DatabaseConnector.insert_one(group)
groupID = id.inserted_id

meeting = {}
meeting['date'] = "2023-12-12"
meeting['group'] = ObjectId(groupID)
meeting['start'] = "11:00"
meeting['end'] = "13:00"
meeting['comment'] = "Thats a comment"

DatabaseConnector = db.meetings
id = DatabaseConnector.insert_one(meeting)
meetingID = id.inserted_id


