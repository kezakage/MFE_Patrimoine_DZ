"""
Semantic search utilities for heritage resources.

Reuses the chatbot's multilingual sentence-transformers model (one process-wide
load shared with the chatbot RAG) so we keep a single embedding pipeline.

Two helpers:
- `compose_text(resource)` builds the text fed to the model. Keeping it in one
  place ensures `embed_heritage` and the search path always embed the *same*
  string for a given resource.
- `semantic_rerank(query, resource_qs, *, top_k)` returns the IDs of the top-K
  resources from `resource_qs` ranked by cosine similarity to `query`.
"""
from __future__ import annotations

from typing import Iterable

from pgvector.django import CosineDistance

from apps.chatbot.services.embeddings import embed_text

from ..models import HeritageResource


def compose_text(resource: HeritageResource) -> str:
    """
    Build the indexable representation of a resource.

    We include the FR + AR name and the description; including the FR enum
    labels (period, type, wilaya) gives the embedding extra lexical signal
    without depending on the i18n layer.
    """
    parts = [resource.name_fr or ""]
    if resource.name_ar:
        parts.append(resource.name_ar)
    if resource.description:
        parts.append(resource.description)
    # Soft signals: surface enum labels so the embedding picks up period and
    # architectural type even when the description doesn't spell them out.
    parts.append(resource.get_period_display())
    parts.append(resource.get_architectural_type_display())
    if resource.wilaya:
        parts.append(resource.wilaya)
    return "\n".join(p for p in parts if p)


def semantic_rerank(
    query: str,
    candidate_ids: Iterable[int] | None = None,
    *,
    top_k: int = 20,
) -> list[tuple[int, float]]:
    """
    Score resources by cosine similarity to `query`.

    Returns a list of (id, distance) tuples, lowest distance first.
    `distance` is pgvector's cosine distance in [0, 2] (0 = identical).

    If `candidate_ids` is provided, the search is restricted to that set
    (typical hybrid-search use case: rerank ES top-N candidates).
    """
    if not query or not query.strip():
        return []

    qvec = embed_text(query)
    qs = (
        HeritageResource.objects
        .exclude(embedding__isnull=True)
        .annotate(distance=CosineDistance("embedding", qvec))
    )
    if candidate_ids is not None:
        qs = qs.filter(id__in=list(candidate_ids))
    qs = qs.order_by("distance")[:top_k]
    return [(r.id, float(r.distance)) for r in qs]
