"""
Enrich existing project pages with additional contextual paragraphs and
sections, so seeded projects look fuller in the UI.

Creates a new PageVersion (version_number = previous + 1) per affected page
and points page.current_version at it. Idempotent: skips pages whose latest
version's change_summary already starts with the enrichment marker.

Usage:
    python manage.py enrich_pages
        [--per-page 3]   number of extra section blocks to append (default: 3)
        [--force]        re-enrich even pages already enriched once

A "section block" = an H2 heading + 1-2 paragraphs.
"""
from __future__ import annotations

import hashlib
import random

from django.core.management.base import BaseCommand

from apps.heritage.models import Project
from apps.pages.models import Page, PageVersion


MARKER = "Enrichissement automatique"


# Bank of section blocks (title, [paragraph_text...]) — picked deterministically
# per-page so the enrichment is varied but stable across runs.
SECTIONS_BANK = [
    (
        "Contexte historique",
        [
            "Le site s'inscrit dans une trame urbaine et symbolique propre à son époque, "
            "où l'architecture servait à la fois de marqueur de pouvoir, de pratique cultuelle "
            "et d'organisation sociale du quartier environnant.",
            "Les sources primaires (chroniques, registres administratifs, rapports de voyageurs) "
            "convergent sur l'importance de l'édifice dans le paysage régional, même si les "
            "dates exactes de fondation restent débattues parmi les historiens.",
        ],
    ),
    (
        "Description architecturale",
        [
            "Le plan général combine plusieurs principes typologiques caractéristiques : "
            "organisation autour d'une cour centrale, hiérarchisation des espaces par le décor, "
            "et orientation contrainte par la topographie ou la pratique rituelle.",
            "L'élévation alterne des registres lisses et des registres ornementés ; les matériaux "
            "(pierre locale, brique cuite, bois de cèdre) témoignent d'une économie de chantier "
            "ancrée dans son territoire.",
        ],
    ),
    (
        "Programme décoratif",
        [
            "Le décor mêle motifs géométriques, épigraphie monumentale et compositions "
            "végétales stylisées. La polychromie d'origine, en grande partie disparue, a pu "
            "être restituée ponctuellement à partir des traces conservées sous les enduits postérieurs.",
        ],
    ),
    (
        "État de conservation",
        [
            "Les pathologies recensées combinent dégradations structurelles (fissurations, "
            "désolidarisation de parements) et altérations de surface (efflorescences salines, "
            "encroûtement noir, perte d'enduits historiques).",
            "Les interventions de restauration successives ont introduit des matériaux modernes "
            "dont la compatibilité avec le bâti d'origine doit être réévaluée à la lumière des "
            "standards actuels (chaux hydraulique naturelle, mortiers de réparation à base "
            "minérale, etc.).",
        ],
    ),
    (
        "Sources et bibliographie",
        [
            "Les recherches en cours s'appuient sur les fonds documentaires des archives "
            "nationales, les relevés photogrammétriques récents et la bibliographie scientifique "
            "de référence — articles à comité de lecture, monographies, thèses de doctorat — "
            "consultable depuis l'onglet « Sources » du projet.",
        ],
    ),
    (
        "Pistes de recherche",
        [
            "Plusieurs axes restent à explorer : comparaison stylistique avec des édifices "
            "contemporains de la même aire culturelle, étude archéométrique des mortiers, et "
            "modélisation 3D des phases successives de chantier.",
            "La contribution de la communauté Patrimoine.dz est précieuse pour mutualiser les "
            "relevés inédits, les photographies anciennes et les témoignages oraux qui peuvent "
            "éclairer les zones d'ombre.",
        ],
    ),
    (
        "Accès et médiation",
        [
            "Le site est accessible au public selon des modalités variables (visites libres, "
            "guidées, ou sur autorisation). Une partie de la documentation produite par ce "
            "projet a vocation à alimenter le dispositif de médiation in situ (panneaux, "
            "applications mobiles, guides imprimés).",
        ],
    ),
]


def _h2(text: str) -> dict:
    return {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": text}]}


def _p(text: str) -> dict:
    return {"type": "paragraph", "content": [{"type": "text", "text": text}]}


def _pick_sections(seed_key: str, n: int):
    """Deterministic pick of n distinct section blocks for a given seed key."""
    rnd = random.Random(int(hashlib.md5(seed_key.encode()).hexdigest(), 16))
    return rnd.sample(SECTIONS_BANK, k=min(n, len(SECTIONS_BANK)))


class Command(BaseCommand):
    help = "Append richer narrative content to seeded project pages (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--per-page", type=int, default=3,
                            help="Number of extra section blocks per page (default: 3).")
        parser.add_argument("--force", action="store_true",
                            help="Re-enrich pages whose latest version is already an enrichment.")

    def handle(self, *args, **options):
        per_page = options["per_page"]
        force = options["force"]

        enriched = 0
        skipped = 0
        for project in Project.objects.all().select_related("created_by"):
            for page in project.pages.all().select_related("current_version"):
                latest = page.current_version
                if not latest:
                    skipped += 1
                    continue

                if not force and (latest.change_summary or "").startswith(MARKER):
                    skipped += 1
                    continue

                # Build enriched content: start from latest version's JSON, append blocks.
                base = latest.content_json or {"type": "doc", "content": []}
                new_blocks = []
                for title, paragraphs in _pick_sections(f"{project.id}-{page.id}", per_page):
                    new_blocks.append(_h2(title))
                    new_blocks.extend(_p(t) for t in paragraphs)

                merged = {
                    "type": "doc",
                    "content": list(base.get("content", [])) + new_blocks,
                }

                new_version = PageVersion.objects.create(
                    page=page,
                    version_number=latest.version_number + 1,
                    content_json=merged,
                    change_summary=f"{MARKER} — +{per_page} section(s)",
                    author=latest.author or project.created_by,
                    discipline=latest.discipline,
                    status=PageVersion.Status.PUBLISHED,
                )
                page.current_version = new_version
                page.save(update_fields=["current_version"])
                enriched += 1

            self.stdout.write(f"  · {project.title}")

        self.stdout.write(self.style.SUCCESS(
            f"Done — {enriched} page(s) enriched, {skipped} skipped."
        ))
