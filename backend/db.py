"""MongoDB client singleton and collection accessors."""
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.db_name]

# Collection accessors
admins = db["admins"]
mediums = db["mediums"]
orders = db["orders"]
gallery = db["gallery"]
testimonials = db["testimonials"]
content = db["content"]
coupons = db["coupons"]
settings_col = db["settings"]
payments = db["payments"]
leads = db["leads"]
