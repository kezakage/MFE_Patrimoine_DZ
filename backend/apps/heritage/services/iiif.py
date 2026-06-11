"""
IIIF Presentation API 3.0 manifest generation for a heritage Project.

Each image :class:`~apps.media.models.Media` attached to the project becomes a
Canvas painted by an Annotation, so the project's illustrations can be opened
in any IIIF-compliant viewer (Mirador, Universal Viewer).

Tiled deep-zoom (IIIF *Image* API 3.0, level 1+) needs a dedicated image server
(e.g. Cantaloupe). Here each Canvas paints the full image directly as a
``level0`` body — interoperable with viewers without that infrastructure.
"""
from __future__ import annotations

from apps.heritage.models import Project

PRESENTATION_CONTEXT = "http://iiif.io/api/presentation/3/context.json"


def _abs(request, url: str) -> str:
    """Resolve a possibly-relative media URL to an absolute URI."""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return request.build_absolute_uri(url)


def _lang_map(value_fr: str, value_ar: str = "") -> dict[str, list[str]]:
    """Build an IIIF language map, keeping Arabic only when present."""
    out = {"fr": [value_fr]}
    if value_ar:
        out["ar"] = [value_ar]
    return out


def project_to_manifest(project: Project, request) -> dict:
    """Return a IIIF Presentation 3.0 manifest dict for ``project``."""
    from apps.media.models import Media

    resource = project.resource
    manifest_id = request.build_absolute_uri(
        f"/api/v1/heritage/projects/{project.pk}/iiif/manifest/"
    )

    images = list(
        Media.objects.filter(project=project, media_type=Media.Type.IMAGE)
        .order_by("created_at")
    )

    canvases = []
    for idx, m in enumerate(images, start=1):
        try:
            image_url = _abs(request, m.file.url)
        except (ValueError, AttributeError):
            continue

        width = m.width or 1000
        height = m.height or 1000
        canvas_id = f"{manifest_id}canvas/{m.pk}"
        anno_page_id = f"{canvas_id}/page/1"
        anno_id = f"{canvas_id}/annotation/1"

        body = {
            "id": image_url,
            "type": "Image",
            "format": m.mime_type or "image/jpeg",
            "width": width,
            "height": height,
        }

        canvas = {
            "id": canvas_id,
            "type": "Canvas",
            "label": _lang_map(m.caption or f"{resource.name_fr} — {idx}"),
            "width": width,
            "height": height,
            "items": [{
                "id": anno_page_id,
                "type": "AnnotationPage",
                "items": [{
                    "id": anno_id,
                    "type": "Annotation",
                    "motivation": "painting",
                    "body": body,
                    "target": canvas_id,
                }],
            }],
        }
        if m.license:
            canvas["requiredStatement"] = {
                "label": _lang_map("Crédit", "المصدر"),
                "value": _lang_map(m.license),
            }
        canvases.append(canvas)

    metadata = [
        {
            "label": _lang_map("Période", "الحقبة"),
            "value": _lang_map(str(resource.get_period_display())),
        },
        {
            "label": _lang_map("Type architectural", "النوع المعماري"),
            "value": _lang_map(str(resource.get_architectural_type_display())),
        },
        {
            "label": _lang_map("Localisation", "الموقع"),
            "value": _lang_map(f"{resource.wilaya}, Algérie"),
        },
        {
            "label": _lang_map("Classement", "التصنيف"),
            "value": _lang_map(str(resource.get_classification_level_display())),
        },
    ]

    manifest = {
        "@context": PRESENTATION_CONTEXT,
        "id": manifest_id,
        "type": "Manifest",
        "label": _lang_map(project.title, resource.name_ar),
        "metadata": metadata,
        "rights": "http://rightsstatements.org/vocab/CNE/1.0/",
        "requiredStatement": {
            "label": _lang_map("Source", "المصدر"),
            "value": _lang_map(
                "PatrimoineHub — Plateforme nationale algérienne du patrimoine"
            ),
        },
        "items": canvases,
    }
    if project.description:
        manifest["summary"] = _lang_map(project.description)
    return manifest
