import os
import shutil
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def get_ffmpeg_location(custom_location: Optional[str] = None) -> Optional[str]:
    """
    Detects ffmpeg executable path or containing directory.
    Checks:
    1. custom_location if provided. If invalid/non-existent, returns None.
    2. shutil.which('ffmpeg')
    3. imageio_ffmpeg.get_ffmpeg_exe()
    4. Common Mac Homebrew / System paths (/opt/homebrew/bin/ffmpeg, /usr/local/bin/ffmpeg, /usr/bin/ffmpeg)
    5. Common directories (/opt/homebrew/bin, /usr/local/bin)

    Returns path string suitable for yt-dlp's ffmpeg_location parameter, or None if not found.
    """
    if custom_location is not None:
        if custom_location and os.path.isfile(custom_location):
            return custom_location
        if custom_location and os.path.isdir(custom_location) and os.path.exists(os.path.join(custom_location, "ffmpeg")):
            return custom_location
        return None

    # 1. Check system PATH via shutil.which
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        logger.info(f"Found ffmpeg via shutil.which: {sys_ffmpeg}")
        return sys_ffmpeg

    # 2. Check imageio_ffmpeg
    try:
        import imageio_ffmpeg
        img_ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        if img_ffmpeg and os.path.exists(img_ffmpeg):
            logger.info(f"Found ffmpeg via imageio_ffmpeg: {img_ffmpeg}")
            return img_ffmpeg
    except Exception as e:
        logger.debug(f"imageio_ffmpeg check failed: {e}")

    # 3. Check common binary paths (Mac Homebrew / Unix)
    common_binary_paths = [
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
    ]
    for path in common_binary_paths:
        if os.path.exists(path) and os.access(path, os.X_OK):
            logger.info(f"Found ffmpeg at common path: {path}")
            return path

    # 4. Check common directories containing ffmpeg
    common_dirs = [
        "/opt/homebrew/bin",
        "/usr/local/bin",
    ]
    for d in common_dirs:
        if os.path.exists(os.path.join(d, "ffmpeg")):
            logger.info(f"Found ffmpeg in directory: {d}")
            return d

    logger.warning("ffmpeg executable not found in PATH, imageio_ffmpeg, or standard locations.")
    return None

def is_ffmpeg_available(ffmpeg_location: Optional[str] = None) -> bool:
    """Returns True if ffmpeg is available on system or at specified location."""
    return get_ffmpeg_location(ffmpeg_location) is not None
