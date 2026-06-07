"""
RAG orchestration using LangChain + Mistral.

Retrieve relevant chunks from the heritage knowledge base, build a grounded
prompt with LangChain, and call Mistral for the answer.

When `MISTRAL_API_KEY` is unset (CI / offline demos), the service falls back
to a deterministic stub that lists the retrieved sources — useful so the UI
keeps working without an API key, and so tests can run hermetically.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from django.conf import settings

from ..models import KnowledgeChunk
from .retriever import retrieve

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
Tu es l'assistant documentaire de PatrimoineHub, la plateforme nationale \
algérienne dédiée au patrimoine architectural. Réponds en français, de \
manière précise et concise, en t'appuyant EXCLUSIVEMENT sur les extraits \
fournis dans le contexte. Si l'information n'est pas dans le contexte, \
dis-le honnêtement plutôt que d'inventer. Cite les sources en fin de \
réponse en mentionnant les titres des notices.\
"""


@dataclass
class RagAnswer:
    text: str
    sources: list[KnowledgeChunk]
    input_tokens: int = 0
    output_tokens: int = 0
    model: str = ""


def _format_context(chunks: list[KnowledgeChunk], max_chars: int) -> str:
    """Concatenate retrieved chunks into a tagged context block, capped."""
    parts: list[str] = []
    used = 0
    for i, c in enumerate(chunks, start=1):
        block = f"[{i}] {c.title}\n{c.text}\n"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
    return "\n".join(parts)


def _stub_answer(question: str, chunks: list[KnowledgeChunk]) -> str:
    """Deterministic fallback when no API key is configured."""
    if not chunks:
        return (
            "Je n'ai pas trouvé d'information pertinente dans la base "
            f"documentaire pour répondre à : « {question} »."
        )
    lines = [
        "Réponse simulée (clé Mistral non configurée — la plateforme renvoie "
        "directement les passages les plus pertinents) :",
        "",
    ]
    for i, c in enumerate(chunks, start=1):
        snippet = c.text[:240].rstrip()
        if len(c.text) > 240:
            snippet += "…"
        lines.append(f"[{i}] {c.title} — {snippet}")
    return "\n".join(lines)


def ask(question: str) -> RagAnswer:
    """Run the full RAG cycle for one user turn."""
    top_k = getattr(settings, "CHATBOT_TOP_K", 5)
    max_chars = getattr(settings, "CHATBOT_MAX_CONTEXT_CHARS", 6000)
    chunks = retrieve(question, top_k=top_k)

    api_key = getattr(settings, "MISTRAL_API_KEY", "")
    model = getattr(settings, "MISTRAL_MODEL", "open-mistral-7b")

    if not api_key:
        return RagAnswer(
            text=_stub_answer(question, chunks),
            sources=chunks,
            model="stub",
        )

    context = _format_context(chunks, max_chars=max_chars)
    user_msg = (
        f"Contexte (extraits de la base PatrimoineHub) :\n\n"
        f"{context}\n\n"
        f"Question de l'utilisateur : {question}"
    )

    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_mistralai import ChatMistralAI
    except Exception as exc:  # noqa: BLE001
        logger.exception("LangChain/Mistral import failed: %s", exc)
        return RagAnswer(text=_stub_answer(question, chunks), sources=chunks, model="stub")

    llm = ChatMistralAI(
        api_key=api_key,
        model=model,
        max_tokens=800,
        temperature=0.2,
    )
    try:
        resp = llm.invoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_msg),
        ])
    except Exception as exc:  # noqa: BLE001
        logger.exception("Mistral API call failed: %s", exc)
        return RagAnswer(text=_stub_answer(question, chunks), sources=chunks, model="stub")

    text = resp.content if isinstance(resp.content, str) else str(resp.content)
    usage = getattr(resp, "response_metadata", {}).get("token_usage", {}) or {}
    return RagAnswer(
        text=text.strip() or _stub_answer(question, chunks),
        sources=chunks,
        input_tokens=usage.get("prompt_tokens", 0),
        output_tokens=usage.get("completion_tokens", 0),
        model=model,
    )
