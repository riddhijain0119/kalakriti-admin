"""Order helper utilities."""
from datetime import datetime
import random
import string

from db import orders


async def generate_order_number() -> str:
    """Generate unique KALA-YYMMDD-XXX order number."""
    today = datetime.utcnow().strftime("%y%m%d")
    for _ in range(10):
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        order_number = f"KALA-{today}-{suffix}"
        if not await orders.find_one({"order_number": order_number}):
            return order_number
    return f"KALA-{today}-{int(datetime.utcnow().timestamp())}"
