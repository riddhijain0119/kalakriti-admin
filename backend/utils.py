"""Utility helpers — primarily MongoDB document serialization."""
from datetime import datetime, date
from typing import Any


def serialize_doc(doc: Any) -> Any:
    """Recursively convert Mongo docs / datetimes / ObjectIds to JSON-safe values."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(x) for x in doc]
    if isinstance(doc, dict):
        out = {}
        for k, v in doc.items():
            if k == "_id":
                continue
            if k == "password_hash":
                continue
            out[k] = serialize_doc(v)
        return out
    if isinstance(doc, (datetime, date)):
        return doc.isoformat()
    return doc
