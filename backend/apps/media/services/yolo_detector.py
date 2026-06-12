"""
Object detection via YOLOv8 (ultralytics).

Complements the CLIP zero-shot classifier:
  - CLIP answers "what is this image?" (mosquée, casbah, ruines romaines…)
  - YOLO answers "what objects are inside and where?" with bounding boxes.

We use the YOLOv8 *nano* preset (`yolov8n.pt`, ~6 MB), pre-trained on COCO
(80 generic classes — person, car, bench, building parts via "person",
"bicycle"… not heritage-specific). For richer patrimoine labels a custom
fine-tuned checkpoint would be needed; the nano model still adds value by
giving scale references (people in shot) and generic-object boxes for the
expert validation queue.

Model is loaded lazily on first use (thread-safe) and cached for the lifetime
of the worker process.
"""
from __future__ import annotations

import logging
import threading
from io import BytesIO
from typing import IO

logger = logging.getLogger(__name__)

# YOLOv8n: nano preset — fastest CPU inference, ~6 MB weights.
_MODEL_NAME = "yolov8n.pt"
# Below this confidence the detection is treated as noise.
_DEFAULT_CONFIDENCE = 0.30

_model = None
_lock = threading.Lock()


def _get_model():
    """Lazy-load the YOLOv8 model (double-checked locking, thread-safe)."""
    global _model
    if _model is not None:
        return _model
    with _lock:
        if _model is None:
            from ultralytics import YOLO  # heavy import — only when first needed
            logger.info("Loading YOLO model '%s' (first call)…", _MODEL_NAME)
            _model = YOLO(_MODEL_NAME)
            logger.info("YOLO model loaded with %d classes.", len(_model.names))
    return _model


def detect_objects(
    image_source: IO[bytes] | bytes,
    *,
    min_score: float = _DEFAULT_CONFIDENCE,
    max_detections: int = 20,
) -> list[dict]:
    """
    Run YOLOv8 inference on the given image and return a ranked list of
    detections sorted by descending confidence:

        [
          {"label": "person", "score": 0.91, "box": [x1, y1, x2, y2]},
          ...
        ]

    Coordinates are absolute pixel values in the source image's frame
    (so the frontend can scale them to the displayed thumbnail).

    `image_source` may be a binary file-like object or a `bytes` blob.
    """
    from PIL import Image

    if isinstance(image_source, (bytes, bytearray)):
        img = Image.open(BytesIO(image_source))
    else:
        img = Image.open(image_source)
    img = img.convert("RGB")

    model = _get_model()
    results = model.predict(img, verbose=False, conf=min_score)
    if not results:
        return []

    r = results[0]
    boxes = r.boxes
    if boxes is None or len(boxes) == 0:
        return []

    names = r.names  # {0: 'person', 1: 'bicycle', ...}
    detections: list[dict] = []
    for cls_id, conf, xyxy in zip(
        boxes.cls.cpu().tolist(),
        boxes.conf.cpu().tolist(),
        boxes.xyxy.cpu().tolist(),
    ):
        detections.append({
            "label": names[int(cls_id)],
            "score": round(float(conf), 4),
            "box": [round(float(v), 1) for v in xyxy],
        })

    detections.sort(key=lambda d: d["score"], reverse=True)
    return detections[:max_detections]
