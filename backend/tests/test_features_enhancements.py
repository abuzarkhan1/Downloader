import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.analyze import SubtitleOption
from app.services.extractor import _format_audio_qualities, extract_media_info, extract_playlist_or_batch_info
from app.services.downloader import convert_subtitles_to_txt, execute_download
from app.services.job_store import job_store
from app.services.storage import storage_manager

client = TestClient(app)


def test_audio_qualities_generation():
    """Verify _format_audio_qualities produces MP3 (128, 192, 320 kbps), M4A (128, 192, 256 kbps), and WAV."""
    formats = _format_audio_qualities([], duration=120)
    assert len(formats) == 7

    mp3_qualities = [f.quality for f in formats if f.ext == "mp3"]
    assert mp3_qualities == ["128kbps", "192kbps", "320kbps"]

    m4a_qualities = [f.quality for f in formats if f.ext == "m4a"]
    assert m4a_qualities == ["128kbps", "192kbps", "256kbps"]

    wav_qualities = [f.quality for f in formats if f.ext == "wav"]
    assert wav_qualities == ["lossless"]


def test_subtitle_extraction():
    """Verify extract_media_info parses manual and automatic subtitles into SubtitleOption objects."""
    mock_info = {
        "title": "Test Video",
        "thumbnail": "https://example.com/thumb.jpg",
        "duration": 60,
        "uploader": "Test Channel",
        "formats": [],
        "subtitles": {
            "en": [{"name": "English"}],
            "es": [{"name": "Spanish"}],
        },
        "automatic_captions": {
            "en": [{"name": "English (auto)"}],
            "fr": [{"name": "French (auto)"}],
        },
    }

    with patch("yt_dlp.YoutubeDL") as mock_ydl_cls:
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.extract_info.return_value = mock_info
        mock_ydl_cls.return_value = mock_ydl

        res = extract_media_info("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube")
        subtitles = res["subtitles"]

        assert len(subtitles) == 3  # en (manual), es (manual), fr (auto)
        langs = [s.lang for s in subtitles]
        assert "en" in langs
        assert "es" in langs
        assert "fr" in langs

        en_sub = next(s for s in subtitles if s.lang == "en")
        assert en_sub.is_auto is False
        assert en_sub.name == "English"

        fr_sub = next(s for s in subtitles if s.lang == "fr")
        assert fr_sub.is_auto is True
        assert fr_sub.name == "French (auto)"


def test_convert_subtitles_to_txt(tmp_path):
    """Verify convert_subtitles_to_txt strips timestamps, line numbers, and VTT headers."""
    vtt_content = """WEBVTT
Kind: captions
Language: en

1
00:00:01.000 --> 00:00:03.000
Hello <v World>World</v>!

2
00:00:03.500 --> 00:00:05.000
This is a test caption line.
"""
    vtt_file = tmp_path / "caption.vtt"
    vtt_file.write_text(vtt_content, encoding="utf-8")

    txt_file = convert_subtitles_to_txt(vtt_file)
    assert txt_file.suffix == ".txt"
    txt_content = txt_file.read_text(encoding="utf-8")

    assert "WEBVTT" not in txt_content
    assert "00:00:01" not in txt_content
    assert "Hello World!" in txt_content
    assert "This is a test caption line." in txt_content


def test_execute_download_audio_m4a_and_wav(tmp_path):
    """Verify execute_download handles m4a and wav format extractions correctly."""
    job_id_m4a = "dl_test_audio_m4a"
    job_store.create_download_job(job_id_m4a, "job_test", "audio", "256kbps", "https://example.com/audio")
    job_dir_m4a = storage_manager.get_job_dir(job_id_m4a)
    dummy_m4a = job_dir_m4a / "audio.m4a"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False

        def mock_download(urls):
            dummy_m4a.write_bytes(b"m4a bytes")

        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(job_id_m4a, "https://example.com/audio", "audio", "256kbps", audio_ext="m4a")
        assert res == str(dummy_m4a)
        assert captured_opts["postprocessors"][0]["preferredcodec"] == "m4a"
        assert captured_opts["postprocessors"][0]["preferredquality"] == "256"


def test_execute_download_subtitle_txt(tmp_path):
    """Verify execute_download handles format_type='subtitle' and subtitle_ext='txt'."""
    job_id_sub = "dl_test_sub_txt"
    job_store.create_download_job(job_id_sub, "job_test", "subtitle", "best", "https://example.com/video")
    job_dir_sub = storage_manager.get_job_dir(job_id_sub)
    vtt_file = job_dir_sub / "subtitle.vtt"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False

        def mock_download(urls):
            vtt_file.write_text("WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nSub text line\n", encoding="utf-8")

        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    with patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(
            job_id_sub,
            "https://example.com/video",
            "subtitle",
            "best",
            subtitle_lang="en",
            subtitle_ext="txt",
        )
        assert res.endswith(".txt")
        assert Path(res).read_text(encoding="utf-8").strip() == "Sub text line"
        assert captured_opts["skip_download"] is True
        assert captured_opts["writesubtitles"] is True
        assert captured_opts["subtitleslangs"] == ["en"]


def test_batch_analyze_endpoint():
    """Verify POST /api/v1/analyze/batch processes multi-line URLs."""
    mock_info = {
        "platform": "youtube",
        "title": "Batch Video Item",
        "thumbnail": "https://example.com/thumb.jpg",
        "duration_seconds": 120,
        "uploader": "Batch Channel",
        "video_formats": [{"quality": "720p", "ext": "mp4", "filesize_mb": 15.0, "fps": 30}],
        "audio_formats": [{"quality": "192kbps", "ext": "mp3", "filesize_mb": 2.5}],
        "subtitles": [],
        "raw_info": {"webpage_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
    }

    with patch("app.services.extractor.extract_media_info", return_value=mock_info):
        payload = {
            "urls": [
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "https://www.youtube.com/watch?v=jNQXAC9IVRw"
            ],
            "remove_watermark": True
        }
        res = client.post("/api/v1/analyze/batch", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["total_items"] == 2
        assert len(data["items"]) == 2
        assert data["items"][0]["title"] == "Batch Video Item"


def test_batch_download_endpoint():
    """Verify POST /api/v1/download/batch queues download jobs for multiple items."""
    with patch("app.jobs.tasks.execute_download"):
        payload = {
            "items": [
                {"id": "job_b1", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "format_type": "video", "quality": "720p"},
                {"id": "job_b2", "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw", "format_type": "audio", "quality": "192kbps", "audio_ext": "mp3"}
            ]
        }
        res = client.post("/api/v1/download/batch", json=payload)
        assert res.status_code == 202
        data = res.json()
        assert len(data["download_jobs"]) == 2
        assert data["download_jobs"][0]["status"] == "queued"
        assert data["download_jobs"][1]["status"] == "queued"
