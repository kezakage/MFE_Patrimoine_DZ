"""
Tests for the FFmpeg video pipeline (apps.media.tasks.transcode_video).

The end-to-end test needs the real ffmpeg/ffprobe binaries and is skipped
when they are absent (e.g. the CI backend image installs them only in the
Docker build). The graceful-degradation and dispatch tests run everywhere.
"""
import os
import subprocess
import tempfile

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.media.models import Media
from apps.media.services import video as videosvc
from apps.media.tasks import transcode_video

pytestmark = pytest.mark.django_db

_HAS_FFMPEG = videosvc.ffmpeg_available()
_skip_no_ffmpeg = pytest.mark.skipif(not _HAS_FFMPEG, reason="ffmpeg/ffprobe not installed")


def _make_test_video(path: str):
    """Render a 2s 320x240 H-less test clip via ffmpeg's lavfi source."""
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=10",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
            "-c:v", "mpeg4", "-c:a", "aac", path,
        ],
        capture_output=True, check=True,
    )


@pytest.fixture
def video_media(expert_user):
    return Media.objects.create(
        uploader=expert_user,
        media_type=Media.Type.VIDEO,
        file=SimpleUploadedFile("t.txt", b"not really a video", content_type="video/mp4"),
        mime_type="video/mp4",
    )


def test_transcode_skips_non_video(expert_user):
    doc = Media.objects.create(
        uploader=expert_user,
        media_type=Media.Type.DOCUMENT,
        file=SimpleUploadedFile("d.pdf", b"%PDF-1.4", content_type="application/pdf"),
    )
    transcode_video(doc.id)  # must not raise
    doc.refresh_from_db()
    assert doc.duration_seconds is None


def test_transcode_handles_missing_media():
    transcode_video(99_999_999)  # must not raise


def test_transcode_degrades_without_ffmpeg(video_media, monkeypatch):
    """When ffmpeg is unavailable the task no-ops without touching the media."""
    monkeypatch.setattr(videosvc, "ffmpeg_available", lambda: False)
    transcode_video(video_media.id)
    video_media.refresh_from_db()
    assert video_media.duration_seconds is None


@_skip_no_ffmpeg
def test_transcode_extracts_metadata_poster_and_mp4(expert_user):
    tmp = tempfile.mkdtemp()
    raw = os.path.join(tmp, "raw.avi")
    _make_test_video(raw)

    with open(raw, "rb") as fh:
        media = Media.objects.create(
            uploader=expert_user,
            media_type=Media.Type.VIDEO,
            file=SimpleUploadedFile("raw.avi", fh.read(), content_type="video/x-msvideo"),
            mime_type="video/x-msvideo",
        )

    transcode_video(media.id)
    media.refresh_from_db()

    assert media.duration_seconds and media.duration_seconds > 1.0
    assert media.width == 320 and media.height == 240
    assert media.thumbnail  # poster extracted
    assert media.mime_type == "video/mp4"
    assert media.file.name.endswith(".mp4")

    # Output must be H.264 so browsers can stream it.
    out = os.path.join(tmp, "out.mp4")
    media.file.open("rb")
    with open(out, "wb") as oh:
        oh.write(media.file.read())
    media.file.close()
    assert videosvc.probe(out).codec == "h264"
