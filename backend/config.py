"""Centralized configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


class Settings:
    # MongoDB
    mongo_url: str = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name: str = os.environ.get("DB_NAME", "kalakriti_admin")

    # CORS
    cors_origins: str = os.environ.get("CORS_ORIGINS", "*")

    # Cashfree
    cashfree_client_id: str = os.environ.get("CASHFREE_CLIENT_ID", "")
    cashfree_client_secret: str = os.environ.get("CASHFREE_CLIENT_SECRET", "")
    cashfree_environment: str = os.environ.get("CASHFREE_ENVIRONMENT", "sandbox")
    cashfree_api_version: str = os.environ.get("CASHFREE_API_VERSION", "2025-01-01")

    @property
    def cashfree_base_url(self) -> str:
        if self.cashfree_environment == "production":
            return "https://api.cashfree.com/pg"
        return "https://sandbox.cashfree.com/pg"

    # Shiprocket
    shiprocket_email: str = os.environ.get("SHIPROCKET_EMAIL", "")
    shiprocket_password: str = os.environ.get("SHIPROCKET_PASSWORD", "")
    shiprocket_pickup_pincode: str = os.environ.get("SHIPROCKET_PICKUP_PINCODE", "201301")
    shiprocket_base_url: str = os.environ.get("SHIPROCKET_BASE_URL", "https://apiv2.shiprocket.in")

    # Admin auth
    admin_email: str = os.environ.get("ADMIN_EMAIL", "admin@kalakriti.in")
    admin_password: str = os.environ.get("ADMIN_PASSWORD", "Kalakriti@2026")
    jwt_secret: str = os.environ.get("JWT_SECRET", "change-me-in-prod")
    jwt_algorithm: str = os.environ.get("JWT_ALGORITHM", "HS256")
    jwt_expiry_hours: int = int(os.environ.get("JWT_EXPIRY_HOURS", "168"))

    # URLs
    backend_base_url: str = os.environ.get("BACKEND_BASE_URL", "http://localhost:8001")
    frontend_base_url: str = os.environ.get("FRONTEND_BASE_URL", "https://kalakritishop.in")


settings = Settings()
