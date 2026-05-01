"""Admin authentication router."""
from fastapi import APIRouter, HTTPException, Depends

from db import admins
from models import LoginRequest, TokenResponse
from auth import verify_password, create_access_token, get_current_admin
from config import settings
from utils import serialize_doc

router = APIRouter(prefix="/api/admin/auth", tags=["admin-auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    admin = await admins.find_one({"email": body.email.lower().strip()})
    if not admin or not verify_password(body.password, admin.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(admin["email"], {"role": admin.get("role", "owner")})
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expiry_hours * 3600,
        admin={"email": admin["email"], "role": admin.get("role", "owner")},
    )


@router.get("/me")
async def me(current=Depends(get_current_admin)):
    return serialize_doc(current)
