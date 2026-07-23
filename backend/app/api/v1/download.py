import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from app.schemas import DownloadRequest, DownloadResponse, DownloadStatusResponse
from app.services.job_store import job_store
from app.jobs.tasks import dispatch_download_job

router = APIRouter(prefix="/download", tags=["Download"])

@router.post("", response_model=DownloadResponse, status_code=status.HTTP_202_ACCEPTED)
async def request_download(payload: DownloadRequest, background_tasks: BackgroundTasks):
    """
    POST /api/v1/download
    Accepts download request: {"id": "job_...", "format_type": "video" | "audio", "quality": "1080p"}
    Returns 202 Accepted: {"download_job_id": "dl_...", "status": "queued"}
    """
    download_job_id = f"dl_{uuid.uuid4().hex[:12]}"
    
    # Resolve target URL from analyze_id or payload
    target_url = job_store.get_url_for_analyze_job(payload.id) or payload.url or payload.id
    if not target_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL or valid analyze job ID must be provided."
        )

    # Initialize job state in JobStore
    job_store.create_download_job(
        download_job_id=download_job_id,
        analyze_id=payload.id,
        format_type=payload.format_type,
        quality=payload.quality,
        url=target_url
    )

    # Dispatch task (Celery worker or local BackgroundTask)
    dispatch_download_job(
        background_tasks=background_tasks,
        download_job_id=download_job_id,
        url=target_url,
        format_type=payload.format_type,
        quality=payload.quality,
        audio_codec=payload.audio_codec,
        audio_bitrate=payload.audio_bitrate,
        extract_subtitles=payload.extract_subtitles or False,
        subtitle_lang=payload.subtitle_lang or "en",
        sponsorblock_remove=payload.sponsorblock_remove or False,
        custom_flags=payload.custom_flags or [],
    )


    return DownloadResponse(download_job_id=download_job_id, status="queued")

@router.get("/{download_job_id}/status", response_model=DownloadStatusResponse)
async def get_download_status(download_job_id: str):
    """
    GET /api/v1/download/{download_job_id}/status
    Returns 200: {"status": "processing" | "ready" | "failed", "progress_percent": 0..100, "file_url": "..."}
    """
    job = job_store.get_job(download_job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Download job '{download_job_id}' not found."
        )

    return DownloadStatusResponse(
        status=job["status"],
        progress_percent=job["progress_percent"],
        file_url=job["file_url"] if job["status"] == "ready" else None,
        error=job.get("error")
    )
