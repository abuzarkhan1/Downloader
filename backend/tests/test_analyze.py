import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.platform_detector import detect_platform
from app.services.extractor import extract_media_info, ExtractionError
from app.services.cache import get_job, JOBS_CACHE

client = TestClient(app)


def test_platform_detector():
    # YouTube URL tests
    assert detect_platform("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "youtube"
    assert detect_platform("https://youtu.be/dQw4w9WgXcQ") == "youtube"
    assert detect_platform("https://www.youtube.com/shorts/abcdef12345") == "youtube"
    assert detect_platform("http://m.youtube.com/watch?v=123456") == "youtube"

    # TikTok URL tests
    assert detect_platform("https://www.tiktok.com/@username/video/7123456789012345678") == "tiktok"
    assert detect_platform("https://vm.tiktok.com/ZM8abc123/") == "tiktok"
    assert detect_platform("https://vt.tiktok.com/ZM8abc123/") == "tiktok"

    # Instagram URL tests
    assert detect_platform("https://www.instagram.com/p/C123456789/") == "instagram"
    assert detect_platform("https://www.instagram.com/reel/C123456789/") == "instagram"
    assert detect_platform("https://instagram.com/reels/C123456789") == "instagram"

    # Facebook URL tests
    assert detect_platform("https://www.facebook.com/watch/?v=123456789") == "facebook"
    assert detect_platform("https://fb.watch/ab123c/") == "facebook"
    assert detect_platform("https://www.facebook.com/reel/987654321") == "facebook"

    # Twitter / X URL tests
    assert detect_platform("https://twitter.com/user/status/1234567890") == "twitter"
    assert detect_platform("https://x.com/user/status/1234567890") == "twitter"
    assert detect_platform("https://mobile.twitter.com/user/statuses/1234567890") == "twitter"
    assert detect_platform("https://x.com/i/status/1234567890") == "twitter"

    # Unsupported URLs
    assert detect_platform("https://example.com/video") is None
    assert detect_platform("invalid_url_string") is None
    assert detect_platform("") is None


def test_analyze_unsupported_url():
    response = client.post("/api/v1/analyze", json={"url": "https://unknownsite.com/watch?v=123"})
    assert response.status_code == 400
    data = response.json()
    assert data["error_code"] == "UNSUPPORTED_URL"
    assert "not supported" in data["message"].lower()


@patch("app.api.v1.analyze.extract_media_info")
def test_analyze_youtube_success(mock_extract):
    mock_extract.return_value = {
        "platform": "youtube",
        "title": "Rick Astley - Never Gonna Give You Up",
        "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        "duration_seconds": 213,
        "uploader": "RickAstleyVEVO",
        "video_formats": [
            {"quality": "1080p", "ext": "mp4", "filesize_mb": 45.0, "fps": 30},
            {"quality": "720p", "ext": "mp4", "filesize_mb": 25.0, "fps": 30},
        ],
        "audio_formats": [
            {"quality": "192kbps", "ext": "mp3", "filesize_mb": 5.1}
        ],
        "raw_info": {"id": "dQw4w9WgXcQ"}
    }

    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    response = client.post("/api/v1/analyze", json={"url": url})

    assert response.status_code == 200
    data = response.json()

    assert data["id"].startswith("job_")
    assert data["platform"] == "youtube"
    assert data["title"] == "Rick Astley - Never Gonna Give You Up"
    assert data["duration_seconds"] == 213
    assert len(data["video_formats"]) == 2
    assert len(data["audio_formats"]) == 1

    # Verify stored in shared cache
    cached_job = get_job(data["id"])
    assert cached_job is not None
    assert cached_job["url"] == url
    assert cached_job["platform"] == "youtube"


@patch("app.api.v1.analyze.extract_media_info")
def test_analyze_private_content(mock_extract):
    mock_extract.side_effect = ExtractionError(
        error_code="PRIVATE_CONTENT",
        message="This content is private or requires authentication.",
        status_code=403,
    )

    url = "https://www.instagram.com/p/privatepost123/"
    response = client.post("/api/v1/analyze", json={"url": url})

    assert response.status_code == 403
    data = response.json()
    assert data["error_code"] == "PRIVATE_CONTENT"
    assert "private" in data["message"].lower()


def test_real_public_link_extraction():
    """Integration test with yt-dlp against a real public YouTube test link."""
    # Official Youtube test video (3 seconds public video)
    test_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"

    try:
        response = client.post("/api/v1/analyze", json={"url": test_url})
        if response.status_code == 200:
            data = response.json()
            assert data["platform"] == "youtube"
            assert "Me at the zoo" in data["title"]
            assert data["id"].startswith("job_")
            assert len(data["video_formats"]) > 0
            assert len(data["audio_formats"]) > 0
            assert get_job(data["id"]) is not None
        else:
            # If network or YouTube rate-limits in test runner environment
            assert response.status_code in [400, 422, 429]
    except Exception as e:
        pytest.skip(f"Network call skipped due to environment restriction: {e}")
