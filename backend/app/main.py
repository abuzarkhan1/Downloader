from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import asyncio
import subprocess
import sys
import logging

logger = logging.getLogger(__name__)


from app.api.v1 import api_router
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.exceptions import AppError

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(ytdlp_auto_updater())
    yield
    task.cancel()

app = FastAPI(
    title="Video Downloader API",
    description="Backend service for link analysis, metadata extraction, and media processing.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiter Middleware setup
app.add_middleware(RateLimiterMiddleware)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    payload = {
        "error_code": exc.error_code,
        "message": exc.message,
        "status_code": exc.status_code
    }
    if exc.detail:
        payload["detail"] = exc.detail
    return JSONResponse(status_code=exc.status_code, content=payload)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Standardizes HTTP exception responses to return PRD Section 8.3 spec error JSON.
    """
    if isinstance(exc.detail, dict) and "error_code" in exc.detail:
        payload = dict(exc.detail)
        payload["status_code"] = exc.status_code
        return JSONResponse(status_code=exc.status_code, content=payload)

    error_code = "HTTP_ERROR"
    if exc.status_code == 404:
        error_code = "NOT_FOUND"
    elif exc.status_code == 400:
        error_code = "BAD_REQUEST"

    payload = {
        "error_code": error_code,
        "message": str(exc.detail),
        "status_code": exc.status_code
    }
    return JSONResponse(status_code=exc.status_code, content=payload)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for Pydantic request validation errors.
    """
    payload = {
        "error_code": "UNPROCESSABLE_ENTITY",
        "message": "Request validation failed.",
        "detail": str(exc.errors()),
        "status_code": 422
    }
    return JSONResponse(status_code=422, content=payload)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    payload = {
        "error_code": "INTERNAL_SERVER_ERROR",
        "message": "An unexpected error occurred.",
        "status_code": 500
    }
    return JSONResponse(status_code=500, content=payload)


# Include API v1 router under /api/v1
app.include_router(api_router, prefix="/api/v1")

async def ytdlp_auto_updater():
    while True:
        try:
            logger.info("Running yt-dlp auto-updater...")
            result = await asyncio.to_thread(
                subprocess.run,
                [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"],
                check=True,
                capture_output=True,
                text=True
            )
            logger.info(f"yt-dlp update successful:\n{result.stdout}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to update yt-dlp:\n{e.stderr}")
        except Exception as e:
            logger.error(f"Unexpected error updating yt-dlp: {e}")
            
        await asyncio.sleep(6 * 60 * 60)  # 6 hours





@app.get("/")
def root():
    return {"message": "Video Downloader API is running", "status": "ok"}
