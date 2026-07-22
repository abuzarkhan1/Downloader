from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import api_router
from app.middleware.rate_limiter import RateLimiterMiddleware

app = FastAPI(
    title="Video Downloader API",
    description="Backend service for link analysis, metadata extraction, and media processing.",
    version="1.0.0",
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiter Middleware setup
app.add_middleware(RateLimiterMiddleware)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Standardizes HTTP exception responses to return PRD Section 8.3 spec error JSON.
    """
    if isinstance(exc.detail, dict) and "error_code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    error_code = "HTTP_ERROR"
    if exc.status_code == 404:
        error_code = "NOT_FOUND"
    elif exc.status_code == 400:
        error_code = "UNSUPPORTED_URL"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": error_code,
            "message": str(exc.detail),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for Pydantic request validation errors.
    """
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "INVALID_REQUEST",
            "message": "Request validation failed.",
            "details": exc.errors(),
        },
    )


# Include API v1 router under /api/v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Video Downloader API is running", "status": "ok"}
