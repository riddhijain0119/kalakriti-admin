"""File upload router — accepts multipart uploads, stores on disk, serves via /api/uploads/."""
import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from auth import get_current_admin
from config import settings

UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}
MAX_SIZE = 15 * 1024 * 1024  # 15 MB

# Admin-protected upload
router = APIRouter(prefix="/api/admin", tags=["uploads"], dependencies=[Depends(get_current_admin)])


@router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported type '{file.content_type}'. Allowed: JPG, PNG, WebP, GIF.")

    # Read with size check
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_SIZE // 1024 // 1024} MB).")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    ext = ALLOWED_TYPES[file.content_type]
    today = datetime.utcnow().strftime("%Y/%m")
    subdir = UPLOAD_DIR / today
    subdir.mkdir(parents=True, exist_ok=True)

    fname = f"{uuid.uuid4().hex}.{ext}"
    path = subdir / fname
    with open(path, "wb") as f:
        f.write(contents)

    relative = f"{today}/{fname}"
    # Build public URL from the incoming request's host (works on both localhost and Emergent preview URL)
    # Prefer X-Forwarded-Proto/Host if behind proxy
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    base = f"{proto}://{host}"
    url = f"{base}/api/uploads/{relative}"
    return {
        "success": True,
        "url": url,
        "relative_path": relative,
        "filename": file.filename,
        "size": len(contents),
        "content_type": file.content_type,
    }


# Public GET for serving — no auth
public_router = APIRouter(prefix="/api/uploads", tags=["uploads-public"])


@public_router.get("/{path:path}")
async def serve_upload(path: str):
    # sanitize
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")
    full = UPLOAD_DIR / path
    if not full.exists() or not full.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(full))
