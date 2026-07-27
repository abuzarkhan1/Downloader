import uuid
from fastapi import APIRouter, HTTPException, status
from app.schemas.analyze import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
    ErrorResponse,
)
from app.services.platform_detector import detect_platform
from app.services.extractor import extract_media_info, extract_playlist_or_batch_info, ExtractionError
from app.services.cache import save_job

router = APIRouter()


def _save_and_build_response(url: str, media_info: dict) -> AnalyzeResponse:
    job_id = f"job_{uuid.uuid4().hex[:10]}"

    def to_dict(fmt):
        if hasattr(fmt, "model_dump"):
            return fmt.model_dump()
        if hasattr(fmt, "dict"):
            return fmt.dict()
        return fmt

    video_fmts = media_info.get("video_formats", [])
    audio_fmts = media_info.get("audio_formats", [])
    sub_opts = media_info.get("subtitles", [])

    job_data = {
        "id": job_id,
        "url": url,
        "platform": media_info["platform"],
        "title": media_info["title"],
        "thumbnail": media_info["thumbnail"],
        "duration_seconds": media_info["duration_seconds"],
        "uploader": media_info["uploader"],
        "video_formats": [to_dict(fmt) for fmt in video_fmts],
        "audio_formats": [to_dict(fmt) for fmt in audio_fmts],
        "subtitles": [to_dict(sub) for sub in sub_opts],
        "raw_info": media_info.get("raw_info"),
    }

    save_job(job_id, job_data)

    return AnalyzeResponse(
        id=job_id,
        platform=media_info["platform"],
        title=media_info["title"],
        thumbnail=media_info["thumbnail"],
        duration_seconds=media_info["duration_seconds"],
        uploader=media_info["uploader"],
        video_formats=video_fmts,
        audio_formats=audio_fmts,
        subtitles=sub_opts,
    )


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
    Analyzes media URL and returns available video/audio formats and subtitles.
    Caches job metadata indexed by job ID.
    """
    url = payload.url
    platform = detect_platform(url)

    if not platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "UNSUPPORTED_URL",
                "message": "The provided URL is not supported. Supported platforms are YouTube, TikTok, Instagram, Facebook, Twitter, Vimeo, Reddit, or generic web links.",
            },
        )

    try:
        media_info = extract_media_info(url, platform, remove_watermark=payload.remove_watermark)
    except ExtractionError as ee:
        raise HTTPException(
            status_code=ee.status_code,
            detail={
                "error_code": ee.error_code,
                "message": ee.message,
            },
        )

    return _save_and_build_response(url, media_info)


@router.post(
    "/analyze/batch",
    response_model=BatchAnalyzeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid batch request"},
        429: {"model": ErrorResponse, "description": "Rate limited"},
    },
)
def analyze_batch(payload: BatchAnalyzeRequest):
    """
    Analyzes playlist URLs or multi-line batch URL lists.
    Returns metadata for all extracted items.
    """
    url_input = payload.urls if payload.urls is not None else payload.url
    if not url_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_REQUEST",
                "message": "Either 'urls' list or 'url' string must be provided.",
            },
        )

    try:
        batch_result = extract_playlist_or_batch_info(url_input, remove_watermark=payload.remove_watermark)
    except ExtractionError as ee:
        raise HTTPException(
            status_code=ee.status_code,
            detail={
                "error_code": ee.error_code,
                "message": ee.message,
            },
        )

    analyzed_items = []
    for item in batch_result.get("items", []):
        raw_info = item.get("raw_info") or {}
        item_url = raw_info.get("webpage_url") or raw_info.get("url") or payload.url or ""
        resp = _save_and_build_response(item_url, item)
        analyzed_items.append(resp)

    return BatchAnalyzeResponse(
        playlist_title=batch_result.get("playlist_title"),
        total_items=len(analyzed_items),
        items=analyzed_items,
    )

