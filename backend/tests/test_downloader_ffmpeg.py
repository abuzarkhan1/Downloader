import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from yt_dlp.utils import DownloadError, PostProcessingError

from app.config import settings
from app.services.downloader import execute_download, is_ffmpeg_available
from app.services.job_store import job_store
from app.services.storage import storage_manager


def test_is_ffmpeg_available_system_path():
    """Test is_ffmpeg_available checking system PATH via shutil.which / get_ffmpeg_location."""
    with patch("app.services.downloader.get_ffmpeg_location", return_value="/usr/bin/ffmpeg"):
        assert is_ffmpeg_available() is True

    with patch("app.services.downloader.get_ffmpeg_location", return_value=None):
        assert is_ffmpeg_available(ffmpeg_location="") is False


def test_is_ffmpeg_available_custom_location(tmp_path):
    """Test is_ffmpeg_available with custom file or directory location."""
    # Test directory containing ffmpeg executable
    ffmpeg_dir = tmp_path / "bin"
    ffmpeg_dir.mkdir()
    ffmpeg_bin = ffmpeg_dir / "ffmpeg"
    ffmpeg_bin.touch()

    assert is_ffmpeg_available(ffmpeg_location=str(ffmpeg_dir)) is True
    assert is_ffmpeg_available(ffmpeg_location=str(ffmpeg_bin)) is True

    non_existent = tmp_path / "non_existent"
    with patch("app.services.downloader.get_ffmpeg_location", return_value=None):
        assert is_ffmpeg_available(ffmpeg_location=str(non_existent)) is False


def test_video_download_format_with_ffmpeg(tmp_path):
    """Test video format options selected when ffmpeg is present."""
    job_id = "dl_ffmpeg_test_01"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")
    
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "test_video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        def mock_download(urls):
            dummy_file.write_bytes(b"video bytes")
        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(job_id, "https://example.com/video", "video", "1080p")
        assert res == str(dummy_file)
        assert "bestvideo" in captured_opts["format"]
        assert "bestaudio" in captured_opts["format"]
        assert captured_opts.get("merge_output_format") == "mp4"


def test_video_download_format_without_ffmpeg_fallback(tmp_path):
    """Test video format falls back to progressive single-file stream when ffmpeg is missing."""
    job_id = "dl_ffmpeg_test_02"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")
    
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "test_video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        def mock_download(urls):
            dummy_file.write_bytes(b"video bytes")
        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=False), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(job_id, "https://example.com/video", "video", "1080p")
        assert res == str(dummy_file)
        assert captured_opts["format"] == "best[height<=1080][ext=mp4]/best[height<=1080]/best[ext=mp4]/best"
        assert "merge_output_format" not in captured_opts


def test_video_download_format_without_ffmpeg_no_height_fallback(tmp_path):
    """Test fallback format when no specific quality height is specified."""
    job_id = "dl_ffmpeg_test_03"
    job_store.create_download_job(job_id, "job_test", "video", "best", "https://example.com/video")
    
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "test_video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        def mock_download(urls):
            dummy_file.write_bytes(b"video bytes")
        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=False), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(job_id, "https://example.com/video", "video", "best")
        assert res == str(dummy_file)
        assert captured_opts["format"] == "best[ext=mp4]/best"


def test_audio_download_format_with_ffmpeg(tmp_path):
    """Test audio format options include FFmpegExtractAudio postprocessor when ffmpeg is present."""
    job_id = "dl_ffmpeg_test_04"
    job_store.create_download_job(job_id, "job_test", "audio", "320kbps", "https://example.com/audio")
    
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "test_audio.mp3"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        def mock_download(urls):
            dummy_file.write_bytes(b"audio bytes")
        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(job_id, "https://example.com/audio", "audio", "320kbps")
        assert res == str(dummy_file)
        assert captured_opts["format"] == "bestaudio/best"
        assert "postprocessors" in captured_opts
        assert captured_opts["postprocessors"][0]["key"] == "FFmpegExtractAudio"
        assert captured_opts["postprocessors"][0]["preferredquality"] == "320"


def test_audio_download_format_without_ffmpeg_fallback(tmp_path):
    """Test audio format falls back to raw audio stream without postprocessors when ffmpeg is missing."""
    job_id = "dl_ffmpeg_test_05"
    job_store.create_download_job(job_id, "job_test", "audio", "192kbps", "https://example.com/audio")
    
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "test_audio.webm"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        def mock_download(urls):
            dummy_file.write_bytes(b"raw audio bytes")
        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=False), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(job_id, "https://example.com/audio", "audio", "192kbps")
        assert res == str(dummy_file)
        assert captured_opts["format"] == "bestaudio/best"
        assert "postprocessors" not in captured_opts


def test_ffmpeg_location_configuration_passed_to_ydl_opts(tmp_path):
    """Test passing ffmpeg_location parameter or settings config populates ydl_opts."""
    job_id = "dl_ffmpeg_test_06"
    job_store.create_download_job(job_id, "job_test", "video", "720p", "https://example.com/video")
    
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "test_video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        def mock_download(urls):
            dummy_file.write_bytes(b"video bytes")
        mock_ydl.download.side_effect = mock_download
        return mock_ydl

    custom_location = "/custom/path/to/ffmpeg"
    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(job_id, "https://example.com/video", "video", "720p", ffmpeg_location=custom_location)
        assert captured_opts.get("ffmpeg_location") == custom_location


def test_error_mapping_missing_ffmpeg_postprocessing_error(tmp_path):
    """Test PostProcessingError mentioning missing ffmpeg maps to user-friendly error message."""
    job_id = "dl_ffmpeg_test_07"
    job_store.create_download_job(job_id, "job_test", "audio", "192kbps", "https://example.com/audio")

    def mock_ydl_init(opts):
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = PostProcessingError("ffmpeg not found. Please install or provide the path using --ffmpeg-location")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        with pytest.raises(Exception) as exc_info:
            execute_download(job_id, "https://example.com/audio", "audio", "192kbps")
        
        expected_msg = "Audio conversion / video merging requires ffmpeg. Please install ffmpeg."
        assert expected_msg in str(exc_info.value)
        
        job = job_store.get_job(job_id)
        assert job["status"] == "failed"
        assert job["error"] == expected_msg


def test_error_mapping_missing_ffmpeg_download_error(tmp_path):
    """Test DownloadError mentioning missing ffmpeg maps to user-friendly error message."""
    job_id = "dl_ffmpeg_test_08"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")

    def mock_ydl_init(opts):
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = DownloadError("Postprocessing: ffmpeg not found")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        with pytest.raises(Exception) as exc_info:
            execute_download(job_id, "https://example.com/video", "video", "1080p")
        
        expected_msg = "Audio conversion / video merging requires ffmpeg. Please install ffmpeg."
        assert expected_msg in str(exc_info.value)
        
        job = job_store.get_job(job_id)
        assert job["status"] == "failed"
        assert job["error"] == expected_msg


def test_error_mapping_other_download_error(tmp_path):
    """Test non-ffmpeg DownloadError retains its original message."""
    job_id = "dl_ffmpeg_test_09"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")

    def mock_ydl_init(opts):
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = DownloadError("HTTP Error 404: Not Found")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        with pytest.raises(Exception) as exc_info:
            execute_download(job_id, "https://example.com/video", "video", "1080p")
        
        assert "HTTP Error 404: Not Found" in str(exc_info.value)
        
        job = job_store.get_job(job_id)
        assert job["status"] == "failed"
        assert job["error"] == "HTTP Error 404: Not Found"


def test_audio_codec_and_bitrate_selection(tmp_path):
    job_id = "dl_audio_options_01"
    job_store.create_download_job(job_id, "job_test", "audio", "best", "https://example.com/audio")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "audio.opus"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"opus bytes")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(
            job_id,
            "https://example.com/audio",
            "audio",
            "best",
            audio_codec="opus",
            audio_bitrate="320k"
        )
        assert captured_opts["postprocessors"][0]["preferredcodec"] == "opus"
        assert captured_opts["postprocessors"][0]["preferredquality"] == "320"


def test_subtitles_and_sponsorblock_and_custom_flags(tmp_path):
    job_id = "dl_advanced_opts_02"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"video bytes")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(
            job_id,
            "https://example.com/video",
            "video",
            "1080p",
            extract_subtitles=True,
            subtitle_lang="es",
            sponsorblock_remove=True,
            custom_flags=["--geo-bypass", "--no-playlist", "--exec rm -rf /"]
        )
        assert captured_opts.get("writesubtitles") is True
        assert captured_opts.get("writeautomaticsub") is True
        assert "es" in captured_opts.get("subtitleslangs", [])
        assert captured_opts.get("sponsorblock_remove") == ["all"]
        assert captured_opts.get("geo_bypass") is True
        assert captured_opts.get("noplaylist") is True


def test_mutagen_metadata_embedding(tmp_path):
    from app.services.downloader import embed_metadata_with_mutagen
    test_mp3 = tmp_path / "test.mp3"
    # Create empty file
    test_mp3.write_bytes(b"ID3\x03\x00\x00\x00\x00\x00\x00")
    embed_metadata_with_mutagen(str(test_mp3), title="Test Song", uploader="Test Artist")
    assert test_mp3.exists()


def test_downloader_remux_mkv(tmp_path):
    job_id = "dl_remux_mkv_01"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "video.mkv"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"video mkv bytes")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        res = execute_download(
            job_id,
            "https://example.com/video",
            "video",
            "1080p",
            remux_mkv=True
        )
        assert res == str(dummy_file)
        assert captured_opts.get("merge_output_format") == "mkv"


def test_downloader_embed_subtitles(tmp_path):
    job_id = "dl_embed_subs_01"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"video bytes")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(
            job_id,
            "https://example.com/video",
            "video",
            "1080p",
            embed_subtitles=True,
            subtitle_lang="es"
        )
        assert captured_opts.get("embedsubtitles") is True
        assert captured_opts.get("writesubtitles") is True
        p_keys = [p.get("key") for p in captured_opts.get("postprocessors", [])]
        assert "FFmpegEmbedSubtitle" in p_keys


def test_downloader_crop_artwork(tmp_path):
    job_id = "dl_crop_artwork_01"
    job_store.create_download_job(job_id, "job_test", "audio", "192kbps", "https://example.com/audio")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "audio.mp3"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"mp3 bytes")
        return mock_ydl

    # Test with crop_artwork=True (default)
    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(
            job_id,
            "https://example.com/audio",
            "audio",
            "192kbps",
            crop_artwork=True
        )
        p_keys = [p.get("key") for p in captured_opts.get("postprocessors", [])]
        assert "FFmpegCropArtwork" in p_keys

    captured_opts.clear()
    # Test with crop_artwork=False
    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(
            job_id,
            "https://example.com/audio",
            "audio",
            "192kbps",
            crop_artwork=False
        )
        p_keys = [p.get("key") for p in captured_opts.get("postprocessors", [])]
        assert "FFmpegCropArtwork" not in p_keys


def test_downloader_cookies_and_proxy(tmp_path):
    job_id = "dl_cookies_proxy_01"
    job_store.create_download_job(job_id, "job_test", "video", "720p", "https://example.com/video")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"video bytes")
        return mock_ydl

    cookies_content = "# Netscape HTTP Cookie File\n.youtube.com TRUE / FALSE 0 SID test_value\n"
    proxy_url = "http://127.0.0.1:8080"

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(
            job_id,
            "https://example.com/video",
            "video",
            "720p",
            cookies_str=cookies_content,
            proxy_url=proxy_url
        )
        assert captured_opts.get("proxy") == proxy_url
        assert captured_opts.get("cookiefile") is not None
        cookie_file_path = Path(captured_opts["cookiefile"])
        assert cookie_file_path.exists()
        assert cookie_file_path.read_text(encoding="utf-8") == cookies_content


def test_downloader_video_clipping(tmp_path):
    job_id = "dl_clipping_01"
    job_store.create_download_job(job_id, "job_test", "video", "1080p", "https://example.com/video")
    job_dir = storage_manager.get_job_dir(job_id)
    dummy_file = job_dir / "video.mp4"

    captured_opts = {}

    def mock_ydl_init(opts):
        captured_opts.update(opts)
        mock_ydl = MagicMock()
        mock_ydl.__enter__.return_value = mock_ydl
        mock_ydl.__exit__.return_value = False
        mock_ydl.download.side_effect = lambda urls: dummy_file.write_bytes(b"video bytes")
        return mock_ydl

    with patch("app.services.downloader.is_ffmpeg_available", return_value=True), \
         patch("yt_dlp.YoutubeDL", side_effect=mock_ydl_init):
        execute_download(
            job_id,
            "https://example.com/video",
            "video",
            "1080p",
            start_time="00:00:10",
            end_time="00:00:30"
        )
        assert "download_ranges" in captured_opts
        pp_args = captured_opts.get("postprocessor_args", {})
        ffmpeg_args = pp_args.get("ffmpeg", [])
        assert "-ss" in ffmpeg_args
        assert "00:00:10" in ffmpeg_args
        assert "-to" in ffmpeg_args
        assert "00:00:30" in ffmpeg_args


