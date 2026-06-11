"""
FFmpeg-backed video utilities: metadata probing, poster extraction and
web-friendly transcoding.

These helpers shell out to the `ffprobe` / `ffmpeg` binaries (installed in
the Docker image). They operate on local file paths, so the Celery task is
responsible for staging the (possibly S3-hosted) media into a temp file
first. Every function degrades gracefully when ffmpeg is unavailable so the
worker never crashes on a host without the binaries.
"""
from __future__ import annotations

import json
import logging
import shutil
import subprocess
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# H.264 + AAC in an MP4 container with the moov atom at the front
# (`+faststart`) is the lowest-common-denominator for progressive HTML5
# <video> playback across browsers.
_WEB_VIDEO_CODEC = "libx264"
_WEB_AUDIO_CODEC = "aac"


def ffmpeg_available() -> bool:
    """True when both ffmpeg and ffprobe are on PATH."""
    return bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))


@dataclass
class VideoMeta:
    duration_seconds: float | None = None
    width: int | None = None
    height: int | None = None
    codec: str | None = None


def probe(path: str) -> VideoMeta:
    """
    Extract duration / dimensions / codec via ffprobe. Returns an empty
    VideoMeta if ffprobe is missing or the file can't be parsed.
    """
    if not shutil.which("ffprobe"):
        return VideoMeta()
    try:
        out = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height,codec_name:format=duration",
                "-of", "json", path,
            ],
            capture_output=True, text=True, timeout=60, check=True,
        ).stdout
        data = json.loads(out)
    except (subprocess.SubprocessError, json.JSONDecodeError, OSError) as exc:
        logger.warning("ffprobe failed for %s: %s", path, exc)
        return VideoMeta()

    stream = (data.get("streams") or [{}])[0]
    fmt = data.get("format") or {}
    duration = fmt.get("duration")
    return VideoMeta(
        duration_seconds=round(float(duration), 3) if duration else None,
        width=int(stream["width"]) if stream.get("width") else None,
        height=int(stream["height"]) if stream.get("height") else None,
        codec=stream.get("codec_name"),
    )


def extract_poster(src_path: str, dst_path: str, *, at_seconds: float = 1.0) -> bool:
    """Grab a single frame at `at_seconds` as a JPEG poster. Returns success."""
    if not shutil.which("ffmpeg"):
        return False
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-ss", str(at_seconds), "-i", src_path,
                "-frames:v", "1", "-q:v", "3",
                "-vf", "scale='min(640,iw)':-2",
                dst_path,
            ],
            capture_output=True, timeout=120, check=True,
        )
        return True
    except (subprocess.SubprocessError, OSError) as exc:
        logger.warning("Poster extraction failed for %s: %s", src_path, exc)
        return False


def transcode_web_mp4(src_path: str, dst_path: str) -> bool:
    """
    Transcode `src_path` to a streamable H.264/AAC MP4 (faststart) at
    `dst_path`. Caps the longest edge at 1280px to keep delivery light.
    Returns True on success.
    """
    if not shutil.which("ffmpeg"):
        return False
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", src_path,
                "-c:v", _WEB_VIDEO_CODEC, "-preset", "medium", "-crf", "23",
                "-vf", "scale='min(1280,iw)':-2",
                "-c:a", _WEB_AUDIO_CODEC, "-b:a", "128k",
                "-movflags", "+faststart",
                dst_path,
            ],
            capture_output=True, timeout=1800, check=True,
        )
        return True
    except (subprocess.SubprocessError, OSError) as exc:
        logger.warning("Transcode failed for %s: %s", src_path, exc)
        return False
