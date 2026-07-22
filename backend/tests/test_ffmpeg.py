import os
from unittest.mock import patch
from app.services.ffmpeg_utils import get_ffmpeg_location

def test_get_ffmpeg_location():
    loc = get_ffmpeg_location()
    print(f"Detected ffmpeg location: {loc}")
    if loc is not None:
        assert os.path.exists(loc), f"ffmpeg path {loc} should exist"

def test_get_ffmpeg_location_with_mock():
    with patch("shutil.which", return_value="/mock/bin/ffmpeg"), \
         patch("os.path.exists", side_effect=lambda path: path == "/mock/bin/ffmpeg"):
        loc = get_ffmpeg_location()
        assert loc == "/mock/bin/ffmpeg"
