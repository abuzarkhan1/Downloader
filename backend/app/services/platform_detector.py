import re
from typing import Optional

# Specific platform regex patterns
YOUTUBE_PATTERN = re.compile(
    r"^(https?://)?(www\.|m\.|music\.|gaming\.)?(youtube\.com/(watch\?.*v=|shorts/|embed/|v/|live/)|youtu\.be/)[a-zA-Z0-9_-]+",
    re.IGNORECASE,
)

TIKTOK_PATTERN = re.compile(
    r"^(https?://)?(www\.|vm\.|vt\.|m\.)?tiktok\.com/(@[\w.-]+/(video|photo)/\d+|t/[\w.-]+|[\w.-]+)",
    re.IGNORECASE,
)

INSTAGRAM_PATTERN = re.compile(
    r"^(https?://)?(www\.|m\.)?instagram\.com/(p|reel|reels|tv|stories|share/reel|share/p)/[\w-]+",
    re.IGNORECASE,
)

FACEBOOK_PATTERN = re.compile(
    r"^(https?://)?(www\.|m\.|web\.|fb\.)?(facebook\.com|fb\.watch|fb\.com)/(watch/?\?.*v=|reel/|reels/|videos/|share/[vr]/|[\w./?=&%-]+)",
    re.IGNORECASE,
)

TWITTER_PATTERN = re.compile(
    r"^(https?://)?(www\.|mobile\.|m\.)?(twitter\.com|x\.com)/[\w.-]+/(status|statuses|i/status)/\d+",
    re.IGNORECASE,
)

VIMEO_PATTERN = re.compile(
    r"^(https?://)?(www\.|player\.)?vimeo\.com/(video/|channels/[\w-]+/|groups/[\w-]+/videos/)?\d+",
    re.IGNORECASE,
)

REDDIT_PATTERN = re.compile(
    r"^(https?://)?(www\.|v\.|old\.|new\.)?(reddit\.com/(r|user|comments)/|v\.redd\.it/|redd\.it/)",
    re.IGNORECASE,
)

GENERIC_HTTP_PATTERN = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)


def detect_platform(url: str) -> Optional[str]:
    """
    Detects platform from URL string.
    Supports YouTube, TikTok, Instagram, Facebook, Twitter, Vimeo, Reddit,
    or generic web video links copied from Chrome browser ('web').
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
    elif TWITTER_PATTERN.search(clean_url):
        return "twitter"
    elif VIMEO_PATTERN.search(clean_url):
        return "vimeo"
    elif REDDIT_PATTERN.search(clean_url):
        return "reddit"
    elif GENERIC_HTTP_PATTERN.search(clean_url):
        return "web"

    return None

