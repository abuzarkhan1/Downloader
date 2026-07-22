import os
import time
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services.storage import storage_manager
from app.middleware.rate_limiter import rate_limiter_instance

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset rate limiter state before each test."""
    rate_limiter_instance.reset()
    yield
    rate_limiter_instance.reset()


def test_temp_storage_ttl_expiration():
    """
    Automated Compliance Test:
    Verifies that temporary files past 1 hour (3600s TTL) are automatically purged
    and do not remain in the temp directory.
    """
    job_id = "job_compliance_test_ttl"
    job_dir = storage_manager.get_job_dir(job_id)
    file_path = job_dir / "personal_archive_clip.mp4"
    
    # Write a dummy file to simulate downloaded content
    file_path.write_bytes(b"dummy video data for compliance test")
    assert file_path.exists()

    # Register file in storage manager
    storage_manager.register_file(job_id, str(file_path))

    # Simulate 1 hour + 1 second elapsed time by backdating created_at timestamp and mtime
    past_time = time.time() - 3601
    storage_manager._registry[job_id]["created_at"] = past_time
    os.utime(file_path, (past_time, past_time))
    os.utime(job_dir, (past_time, past_time))

    # Trigger cleanup
    purged_count = storage_manager.cleanup_expired_files()
    
    # Verify file was purged and does not exist on disk
    assert not file_path.exists(), "File remaining in temp directory past 1 hour TTL!"
    assert not job_dir.exists(), "Job temp directory remaining past TTL!"
    assert storage_manager.get_file_path(job_id) is None


@patch("app.api.v1.analyze.extract_media_info")
def test_rate_limiter_analyze_threshold(mock_extract):
    """
    Automated Compliance Test:
    Verifies that the rate limiter enforces the threshold of 10 analyze requests per hour per client IP
    and returns HTTP 429 with RATE_LIMITED error code on the 11th request.
    """
    mock_extract.return_value = {
        "platform": "youtube",
        "title": "Test Personal Archive Video",
        "thumbnail": "https://example.com/thumb.jpg",
        "duration_seconds": 120,
        "uploader": "Test Channel",
        "video_formats": [{"quality": "720p", "ext": "mp4", "filesize_mb": 15.0, "fps": 30}],
        "audio_formats": [{"quality": "192kbps", "ext": "mp3", "filesize_mb": 2.5}],
    }

    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ip = "192.168.1.100"
    headers = {"X-Forwarded-For": ip}

    # Send 10 analyze requests (matching 10/hour limit)
    for i in range(10):
        response = client.post("/api/v1/analyze", json={"url": url}, headers=headers)
        assert response.status_code != 429, f"Unexpected 429 on request #{i+1}"

    # The 11th request must be blocked by rate limiter
    response = client.post("/api/v1/analyze", json={"url": url}, headers=headers)
    assert response.status_code == 429, "Rate limiter failed to block 11th analyze request!"
    
    data = response.json()
    assert data["error_code"] == "RATE_LIMITED"
    assert data["message"] == "Rate limit exceeded. Try again later."


@patch("app.api.v1.download.dispatch_download_job")
def test_rate_limiter_download_threshold(mock_dispatch):
    """
    Automated Compliance Test:
    Verifies that the rate limiter enforces the threshold of 5 download requests per hour per client IP
    and returns HTTP 429 with RATE_LIMITED error code on the 6th request.
    """
    payload = {
        "id": "job_test_dl_rate",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "format_type": "video",
        "quality": "720p"
    }
    ip = "192.168.1.101"
    headers = {"X-Forwarded-For": ip}

    # Send 5 download requests (matching 5/hour limit)
    for i in range(5):
        response = client.post("/api/v1/download", json=payload, headers=headers)
        assert response.status_code != 429, f"Unexpected 429 on request #{i+1}"

    # The 6th request must be blocked by rate limiter
    response = client.post("/api/v1/download", json=payload, headers=headers)
    assert response.status_code == 429, "Rate limiter failed to block 6th download request!"

    data = response.json()
    assert data["error_code"] == "RATE_LIMITED"
    assert data["message"] == "Rate limit exceeded. Try again later."


@patch("app.api.v1.download.dispatch_download_job")
def test_rate_limiter_ip_isolation(mock_dispatch):
    """
    Automated Compliance Test:
    Verifies rate limits are enforced per client IP independently.
    """
    payload = {
        "id": "job_ip_iso",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "format_type": "video",
        "quality": "720p"
    }
    ip1 = "10.0.0.1"
    ip2 = "10.0.0.2"

    # Exhaust ip1 limit (5 downloads)
    for _ in range(5):
        client.post("/api/v1/download", json=payload, headers={"X-Forwarded-For": ip1})

    # ip1 should be rate limited
    res_ip1 = client.post("/api/v1/download", json=payload, headers={"X-Forwarded-For": ip1})
    assert res_ip1.status_code == 429

    # ip2 should NOT be rate limited
    res_ip2 = client.post("/api/v1/download", json=payload, headers={"X-Forwarded-For": ip2})
    assert res_ip2.status_code != 429
