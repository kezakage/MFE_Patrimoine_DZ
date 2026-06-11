"""
(Re)compute the dense semantic embedding stored on each HeritageResource.

By default only resources without an embedding are processed; pass `--all` to
re-embed every row (e.g. after changing the embedding model or extending the
compose_text() signal).

Usage:
    python manage.py embed_heritage           # backfill missing embeddings
    python manage.py embed_heritage --all     # re-embed everything
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.chatbot.services.embeddings import embed_batch
from apps.heritage.models import HeritageResource
from apps.heritage.services.semantic import compose_text


class Command(BaseCommand):
    help = "Backfill or refresh semantic embeddings on HeritageResource rows."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Re-embed every resource (default: only those missing an embedding).",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=16,
            help="How many texts to embed per forward pass (default 16).",
        )

    def handle(self, *args, **opts):
        qs = HeritageResource.objects.all()
        if not opts["all"]:
            qs = qs.filter(embedding__isnull=True)
        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("Nothing to embed."))
            return

        batch_size = max(1, int(opts["batch_size"]))
        self.stdout.write(f"Embedding {total} heritage resource(s)...")

        processed = 0
        # Iterate in stable id order so a re-run after Ctrl-C resumes predictably.
        ids = list(qs.order_by("id").values_list("id", flat=True))
        for start in range(0, len(ids), batch_size):
            chunk_ids = ids[start : start + batch_size]
            resources = list(
                HeritageResource.objects.filter(id__in=chunk_ids).order_by("id")
            )
            texts = [compose_text(r) for r in resources]
            vectors = embed_batch(texts)
            for r, v in zip(resources, vectors):
                r.embedding = v
            # bulk_update keeps Postgres round-trips proportional to batch_size.
            HeritageResource.objects.bulk_update(resources, ["embedding"])
            processed += len(resources)
            self.stdout.write(f"  {processed}/{total}")

        self.stdout.write(self.style.SUCCESS(
            f"Done — embedded {processed} resource(s)."
        ))
