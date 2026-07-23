import os
import time
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.storage import TemporaryStorageManager, storage_manager
from app.services.job_store import job_store
from app.jobs.celery_app import is_celery_available

client = TestClient(app)

def test_download_queuing():
    """Test POST /api/v1/download endpoint returns 202 Accepted and download_job_id."""
    job_store.register_analyze_job("job_test123", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    # Mock downloader execution to avoid calling actual yt-dlp in test
    with patch("app.jobs.tasks.execute_download") as mock_exec:
        response = client.post(
            "/api/v1/download",
            json={
                "id": "job_test123",
                "format_type": "video",
                "quality": "1080p"
            }
        )
        assert response.status_code == 202
        data = response.json()
        assert "download_job_id" in data
        assert data["download_job_id"].startswith("dl_")
        assert data["status"] == "queued"


def test_download_status_reporting():
    """Test GET /api/v1/download/{download_job_id}/status endpoint returns status and progress."""
    job_id = "dl_status_test_001"
    job_store.create_download_job(job_id, "job_test", "audio", "192kbps", "https://example.com/video")
    
    # Initially queued
    res1 = client.get(f"/api/v1/download/{job_id}/status")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "queued"
    assert data1["progress_percent"] == 0.0
    assert data1["file_url"] is None

    # Update progress
    job_store.update_job_progress(job_id, 45.5, status="processing")
    res2 = client.get(f"/api/v1/download/{job_id}/status")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "processing"
    assert data2["progress_percent"] == 45.5

    # Set ready
    expected_file_url = f"http://localhost:8000/api/v1/files/{job_id}"
    job_store.set_job_ready(job_id, expected_file_url)
    res3 = client.get(f"/api/v1/download/{job_id}/status")
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["status"] == "ready"
    assert data3["progress_percent"] == 100.0
    assert data3["file_url"] == expected_file_url


def test_download_status_not_found():
    """Test 404 for non-existent job ID."""
    res = client.get("/api/v1/download/dl_non_existent/status")
    assert res.status_code == 404


def test_file_streaming_and_post_download_cleanup(tmp_path):
    """Test file streaming endpoint serves media file and cleans it up after download."""
    test_storage = TemporaryStorageManager(temp_dir=str(tmp_path), ttl_seconds=3600)
    job_id = "dl_file_test_002"
    
    job_dir = test_storage.get_job_dir(job_id)
    test_file = job_dir / "sample_audio.mp3"
    test_file.write_bytes(b"dummy mp3 content audio bytes")
    test_storage.register_file(job_id, str(test_file))

    # Patch global storage_manager in app modules
    with patch("app.api.v1.files.storage_manager", test_storage):
        # Request file without immediate background execution (TestClient executes background tasks sync)
        res = client.get(f"/api/v1/files/{job_id}")
        assert res.status_code == 200
        assert res.content == b"dummy mp3 content audio bytes"
        assert res.headers["content-type"] == "audio/mpeg"
        
        # Verify file is auto-deleted after response completion
        assert not test_file.exists()


def test_file_streaming_unicode_title(tmp_path):
    """Test file streaming endpoint serves media files with Unicode titles without UnicodeEncodeError."""
    test_storage = TemporaryStorageManager(temp_dir=str(tmp_path), ttl_seconds=3600)
    job_id = "dl_unicode_test_004"
    
    job_dir = test_storage.get_job_dir(job_id)
    unicode_file = job_dir / "Sunset vibes at the coast 🌅 | Reel by @traveler_life.mp4"
    unicode_file.write_bytes(b"dummy mp4 video bytes with unicode title")
    test_storage.register_file(job_id, str(unicode_file))

    with patch("app.api.v1.files.storage_manager", test_storage):
        res = client.get(f"/api/v1/files/{job_id}")
        assert res.status_code == 200
        assert res.content == b"dummy mp4 video bytes with unicode title"
        assert res.headers["content-type"] == "video/mp4"
        assert "Content-Disposition" in res.headers
        assert "filename*=UTF-8''" in res.headers["Content-Disposition"]


def test_storage_ttl_expiration(tmp_path):
    """Test storage manager auto-deletes files older than TTL (1 hour)."""
    # Create storage manager with 1 second TTL for testing
    short_storage = TemporaryStorageManager(temp_dir=str(tmp_path), ttl_seconds=1)
    job_id = "dl_ttl_test_003"
    
    job_dir = short_storage.get_job_dir(job_id)
    dummy_file = job_dir / "video.mp4"
    dummy_file.write_bytes(b"dummy mp4 content")
    short_storage.register_file(job_id, str(dummy_file))

    # Before expiration
    assert short_storage.get_file_path(job_id) is not None

    # Wait for TTL expiration
    time.sleep(1.2)

    # After expiration
    assert short_storage.get_file_path(job_id) is None
    assert not dummy_file.exists()


def test_celery_fallback():
    """Test fallback logic when Redis/Celery is disabled or unreachable."""
    with patch("app.config.settings.USE_CELERY", False):
        assert is_celery_available() is False


def test_download_request_payload_extended_fields():
    job_store.register_analyze_job("job_ext123", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    with patch("app.api.v1.download.dispatch_download_job") as mock_dispatch:
        response = client.post(
            "/api/v1/download",
            json={
                "id": "job_ext123",
                "format_type": "audio",
                "quality": "320kbps",
                "audio_codec": "flac",
                "audio_bitrate": "320k",
                "extract_subtitles": True,
                "subtitle_lang": "en",
                "sponsorblock_remove": True,
                "custom_flags": ["--geo-bypass"]
            }
        )
        assert response.status_code == 202
        data = response.json()
        assert "download_job_id" in data
        assert mock_dispatch.called
        kwargs = mock_dispatch.call_args.kwargs
        assert kwargs["audio_codec"] == "flac"
        assert kwargs["audio_bitrate"] == "320k"
        assert kwargs["extract_subtitles"] is True
        assert kwargs["subtitle_lang"] == "en"
        assert kwargs["sponsorblock_remove"] is True
        assert kwargs["custom_flags"] == ["--geo-bypass"]


def test_download_request_payload_parity_fields():
    job_store.register_analyze_job("job_parity123", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    with patch("app.api.v1.download.dispatch_download_job") as mock_dispatch:
        response = client.post(
            "/api/v1/download",
            json={
                "id": "job_parity123",
                "format_type": "video",
                "quality": "1080p",
                "remux_mkv": True,
                "crop_artwork": False,
                "embed_subtitles": True,
                "cookies_str": "session=abc",
                "proxy_url": "http://proxy.local:8080",
                "start_time": "00:00:10",
                "end_time": "00:00:30"
            }
        )
        assert response.status_code == 202
        data = response.json()
        assert "download_job_id" in data
        assert mock_dispatch.called
        kwargs = mock_dispatch.call_args.kwargs
        assert kwargs["remux_mkv"] is True
        assert kwargs["crop_artwork"] is False
        assert kwargs["embed_subtitles"] is True
        assert kwargs["cookies_str"] == "session=abc"
        assert kwargs["proxy_url"] == "http://proxy.local:8080"
        assert kwargs["start_time"] == "00:00:10"
        assert kwargs["end_time"] == "00:00:30"


def test_download_request_payload_agent1_parity_fields():
    job_store.register_analyze_job("job_agent1_123", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    with patch("app.api.v1.download.dispatch_download_job") as mock_dispatch:
        response = client.post(
            "/api/v1/download",
            json={
                "id": "job_agent1_123",
                "format_type": "video",
                "quality": "1080p",
                "max_filesize": "50M",
                "rate_limit": "500k",
                "restrict_filenames": True,
                "force_ipv4": True,
                "output_template": "%(title)s_custom.%(ext)s"
            }
        )
        assert response.status_code == 202
        data = response.json()
        assert "download_job_id" in data
        assert mock_dispatch.called
        kwargs = mock_dispatch.call_args.kwargs
        assert kwargs["max_filesize"] == "50M"
        assert kwargs["rate_limit"] == "500k"
        assert kwargs["restrict_filenames"] is True
        assert kwargs["force_ipv4"] is True
        assert kwargs["output_template"] == "%(title)s_custom.%(ext)s"


def test_downloader_agent1_ydl_opts_parity(tmp_path):
    from app.services.downloader import execute_download
    job_id = "dl_agent1_parity_01"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "custom_video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"dummy video bytes")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(
            job_id,
            "https://example.com/video",
            "video",
            "1080p",
            max_filesize="50M",
            rate_limit="500k",
            restrict_filenames=True,
            force_ipv4=True,
            output_template="custom_video.%(ext)s"
        )
        assert res == str(dummy_file)
        assert captured_opts.get("max_filesize") == 52428800
        assert captured_opts.get("ratelimit") == 512000
        assert captured_opts.get("restrictfilenames") is True
        assert captured_opts.get("source_address") == "0.0.0.0"
        assert captured_opts.get("outtmpl") == str(job_dir / "custom_video.%(ext)s")



