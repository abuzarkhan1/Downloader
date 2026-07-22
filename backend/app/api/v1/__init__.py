from fastapi import APIRouter
from app.api.v1.analyze import router as analyze_router
from app.api.v1.download import router as download_router
from app.api.v1.files import router as files_router

api_router = APIRouter()
api_router.include_router(analyze_router, tags=["analyze"])
api_router.include_router(download_router)
api_router.include_router(files_router)
