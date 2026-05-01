"""Admin dashboard + analytics."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends

from db import orders
from auth import get_current_admin
from utils import serialize_doc

router = APIRouter(prefix="/api/admin", tags=["admin-analytics"], dependencies=[Depends(get_current_admin)])


@router.get("/dashboard/stats")
async def dashboard_stats():
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    month_start = datetime(now.year, now.month, 1)

    # Counts
    total_orders = await orders.count_documents({})
    today_orders = await orders.count_documents({"created_at": {"$gte": today_start}})
    pending_shipments = await orders.count_documents({
        "status": {"$in": ["APPROVED", "PRINTING", "PAYMENT_RECEIVED", "IN_PROGRESS"]},
        "shipping.awb_code": None,
    })

    # Revenue MTD: sum of paid orders since month_start
    pipeline = [
        {"$match": {"payment.status": "PAID", "payment.paid_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$payment.amount"}}},
    ]
    rev_mtd_cursor = orders.aggregate(pipeline)
    rev_mtd_doc = await rev_mtd_cursor.to_list(length=1)
    revenue_mtd = rev_mtd_doc[0]["total"] if rev_mtd_doc else 0

    # Revenue today
    pipeline_today = [
        {"$match": {"payment.status": "PAID", "payment.paid_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$payment.amount"}}},
    ]
    rev_today_doc = await orders.aggregate(pipeline_today).to_list(length=1)
    revenue_today = rev_today_doc[0]["total"] if rev_today_doc else 0

    # Status funnel
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    status_counts = await orders.aggregate(status_pipeline).to_list(length=30)
    status_map = {s["_id"]: s["count"] for s in status_counts}

    # Orders by medium
    medium_pipeline = [
        {"$group": {"_id": "$medium_slug", "count": {"$sum": 1}, "revenue": {"$sum": "$pricing.total"}}},
    ]
    by_medium = await orders.aggregate(medium_pipeline).to_list(length=20)

    # Recent orders
    recent = await orders.find({}).sort("created_at", -1).limit(8).to_list(length=8)

    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "pending_shipments": pending_shipments,
        "revenue_today": round(float(revenue_today), 2),
        "revenue_mtd": round(float(revenue_mtd), 2),
        "status_counts": status_map,
        "by_medium": [{"medium_slug": m["_id"], "count": m["count"], "revenue": float(m.get("revenue") or 0)} for m in by_medium],
        "recent_orders": [serialize_doc(r) for r in recent],
    }


@router.get("/analytics/revenue-timeseries")
async def revenue_timeseries(days: int = 30):
    start = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"payment.status": "PAID", "payment.paid_at": {"$gte": start}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$payment.paid_at"}
                },
                "revenue": {"$sum": "$payment.amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    data = await orders.aggregate(pipeline).to_list(length=365)
    return [{"date": d["_id"], "revenue": float(d["revenue"]), "count": d["count"]} for d in data]


@router.get("/analytics/orders-by-status")
async def orders_by_status():
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    data = await orders.aggregate(pipeline).to_list(length=30)
    return [{"status": d["_id"], "count": d["count"]} for d in data]


@router.get("/analytics/orders-by-medium")
async def orders_by_medium():
    pipeline = [
        {"$group": {"_id": "$medium_slug", "count": {"$sum": 1}, "revenue": {"$sum": "$pricing.total"}}},
        {"$sort": {"count": -1}},
    ]
    data = await orders.aggregate(pipeline).to_list(length=30)
    return [{"medium_slug": d["_id"], "count": d["count"], "revenue": float(d.get("revenue") or 0)} for d in data]
