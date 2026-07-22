import re
from typing import Optional

# Platform regex patterns
YOUTUBE_PATTERN = re.compile(
    r"^(https?://)?(www\.|m\.)?(youtube\.com/(watch\?.*v=|shorts/|embed/)|youtu\.be/)[a-zA-Z0-9_-]+",
    re.IGNORECASE,
)

TIKTOK_PATTERN = re.compile(
    r"^(https?://)?(www\.|vm\.|vt\.)?tiktok\.com/(@[\w.-]+/video/\d+|[\w.-]+)",
    re.IGNORECASE,
)

INSTAGRAM_PATTERN = re.compile(
    r"^(https?://)?(www\.)?instagram\.com/(p|reel|reels|tv)/[\w-]+",
    re.IGNORECASE,
)

FACEBOOK_PATTERN = re.compile(
    r"^(https?://)?(www\.|m\.|web\.|fb\.)?(facebook\.com|fb\.watch|fb\.com)/[\w./?=&%-]+",
    re.IGNORECASE,
)


def detect_platform(url: str) -> Optional[str]:
    """
    Detects platform from URL string.
    Returns 'youtube', 'tiktok', 'instagram', 'facebook', or None if unsupported.
    """
    if not url or not isinstance(url, str):
        return None

    clean_url = url.strip()

    if YOUTUBE_PATTERN.search(clean_url):
        return "youtube"
    elif TIKTOK_PATTERN.search(clean_url):
        return "tiktok"
    elif INSTAGRAM_PATTERN.search(clean_url):
        return "instagram"
    elif FACEBOOK_PATTERN.search(clean_url):
        return "facebook"

    return None
