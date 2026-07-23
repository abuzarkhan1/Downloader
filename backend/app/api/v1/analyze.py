import uuid
from fastapi import APIRouter, HTTPException, status
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, ErrorResponse
from app.services.platform_detector import detect_platform
from app.services.extractor import extract_media_info, ExtractionError
from app.services.cache import save_job

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Unsupported URL or invalid request"},
        403: {"model": ErrorResponse, "description": "Private or restricted content"},
        422: {"model": ErrorResponse, "description": "Platform blocked or unprocessable content"},
        429: {"model": ErrorResponse, "description": "Rate limited"},
    },
)
def analyze_media(payload: AnalyzeRequest):
    """
    Analyzes media URL and returns available video/audio formats.
    Caches job metadata indexed by job ID.
    """
    url = payload.url
    platform = detect_platform(url)

    if not platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "UNSUPPORTED_URL",
                "message": "The provided URL is not supported. Supported platforms are YouTube, TikTok, Instagram, Facebook, and X (Twitter).",
            },
        )

    try:
        media_info = extract_media_info(url, platform)
    except ExtractionError as ee:
        raise HTTPException(
            status_code=ee.status_code,
            detail={
                "error_code": ee.error_code,
                "message": ee.message,
            },
        )

    job_id = f"job_{uuid.uuid4().hex[:10]}"

    def to_dict(fmt):
        if hasattr(fmt, "model_dump"):
            return fmt.model_dump()
        if hasattr(fmt, "dict"):
            return fmt.dict()
        return fmt

    job_data = {
        "id": job_id,
        "url": url,
        "platform": media_info["platform"],
        "title": media_info["title"],
        "thumbnail": media_info["thumbnail"],
        "duration_seconds": media_info["duration_seconds"],
        "uploader": media_info["uploader"],
        "video_formats": [to_dict(fmt) for fmt in media_info["video_formats"]],
        "audio_formats": [to_dict(fmt) for fmt in media_info["audio_formats"]],
        "raw_info": media_info.get("raw_info"),
    }

    # Store in shared cache for Agent B to use
    save_job(job_id, job_data)

    return AnalyzeResponse(
        id=job_id,
        platform=media_info["platform"],
        title=media_info["title"],
        thumbnail=media_info["thumbnail"],
        duration_seconds=media_info["duration_seconds"],
        uploader=media_info["uploader"],
        video_formats=media_info["video_formats"],
        audio_formats=media_info["audio_formats"],
    )
