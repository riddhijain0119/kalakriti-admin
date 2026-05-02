"""Main FastAPI server."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from auth import ensure_default_admin
from seed import seed_all
from routers.admin_auth import router as admin_auth_router
from routers.admin_crud import router as admin_crud_router
from routers.admin_orders import router as admin_orders_router
from routers.admin_analytics import router as admin_analytics_router
from routers.public import router as public_router
from routers.uploads import router as uploads_admin_router, public_router as uploads_public_router
from routers.compat import router as compat_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kalakriti")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Kalakriti Admin backend")
    try:
        await ensure_default_admin()
        await seed_all()
        logger.info("Default admin and seed data ensured")
    except Exception as e:
        logger.exception(f"Startup error: {e}")
    yield
    logger.info("Shutting down")


app = FastAPI(title="Kalakriti Admin API", version="1.0.0", lifespan=lifespan)

# CORS — must list explicit origins when allow_credentials=True (spec forbids wildcard with credentials)
cors_origins = settings.cors_origins
if cors_origins == "*" or not cors_origins:
    # Sensible defaults for Kalakriti
    default_origins = [
        "https://kalakritishop.in",
        "https://www.kalakritishop.in",
        "http://localhost:3000",
    ]
    origins = default_origins
    allow_origin_regex = r"https://.*\.(emergent\.host|emergentagent\.com|vercel\.app)"
else:
    origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
    allow_origin_regex = r"https://.*\.(emergent\.host|emergentagent\.com|vercel\.app)"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Base health router (for /api/ ping)
base = APIRouter(prefix="/api")


@base.get("/")
async def root():
    return {"message": "Kalakriti Admin API", "version": "1.0.0"}


@base.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(base)
app.include_router(admin_auth_router)
app.include_router(admin_crud_router)
app.include_router(admin_orders_router)
app.include_router(admin_analytics_router)
app.include_router(uploads_admin_router)
app.include_router(uploads_public_router)
app.include_router(compat_router)
app.include_router(public_router)
