import mimetypes
import urllib.parse
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse
from app.services.storage import storage_manager

router = APIRouter(prefix="/files", tags=["Files"])

@router.get("/{download_job_id}")
async def serve_downloaded_file(download_job_id: str, background_tasks: BackgroundTasks, cleanup_after: bool = True):
    """
    GET /api/v1/files/{download_job_id}
    File streaming endpoint that serves the media file and handles post-download TTL cleanup.
    Confirm NO permanent media storage. Handles Unicode filenames safely per RFC 5987.
    """
    file_path = storage_manager.get_file_path(download_job_id)
    if not file_path or not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File for download job '{download_job_id}' not found or expired."
        )

    # Determine mime content-type
    media_type, _ = mimetypes.guess_type(str(file_path))
    if not media_type:
        if file_path.suffix.lower() == ".mp3":
            media_type = "audio/mpeg"
        elif file_path.suffix.lower() == ".mp4":
            media_type = "video/mp4"
        else:
            media_type = "application/octet-stream"

    # Schedule post-download file deletion to satisfy NO permanent media storage requirement
    if cleanup_after:
        background_tasks.add_task(storage_manager.delete_job_file, download_job_id)

    # Sanitize ASCII filename for legacy HTTP headers and encode UTF-8 per RFC 5987
    raw_name = file_path.name
    ascii_name = "".join(c for c in raw_name if ord(c) < 128 and c not in '"\r\n\\')
    if not ascii_name:
        ascii_name = f"media_{download_job_id}{file_path.suffix}"

    utf8_encoded_name = urllib.parse.quote(raw_name)
    content_disposition = f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{utf8_encoded_name}'

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        headers={"Content-Disposition": content_disposition}
    )
