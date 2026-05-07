"""
Celery tasks for media processing.

Currently:
  - generate_thumbnail: extracts a thumbnail and image dimensions for an image upload.
"""
from celery import shared_task


@shared_task
def generate_thumbnail(media_id: int):
    """Generate a thumbnail for an image media (no-op for video/document for now)."""
    from io import BytesIO

    from django.core.files.base import ContentFile

    from .models import Media

    try:
        media = Media.objects.get(pk=media_id)
    except Media.DoesNotExist:
        return

    if media.media_type != Media.Type.IMAGE:
        return

    try:
        from PIL import Image
    except ImportError:
        # Pillow not installed — skip silently
        return

    try:
        media.file.open("rb")
        img = Image.open(media.file)
        media.width, media.height = img.size

        img.thumbnail((400, 400))
        buffer = BytesIO()
        fmt = (img.format or "JPEG")
        img.save(buffer, format=fmt)
        buffer.seek(0)

        thumb_name = f"thumb_{media.pk}.{fmt.lower()}"
        media.thumbnail.save(thumb_name, ContentFile(buffer.read()), save=False)
        media.save(update_fields=["width", "height", "thumbnail"])
    except Exception:
        # Don't crash the worker on a bad image
        return
    finally:
        try:
            media.file.close()
        except Exception:
            pass
