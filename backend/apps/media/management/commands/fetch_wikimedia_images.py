"""
Fetch real photographs of each seeded monument from Wikimedia Commons and
attach them as Media rows on the corresponding Project.

Wikimedia Commons exposes a public REST + MediaWiki API; we query it with
targeted search terms per monument, download the top image results (which
are CC-licensed), and save them with a `[wiki]` caption marker so reruns
are idempotent.

Usage:
    python manage.py fetch_wikimedia_images
        [--per-project 5]   number of images to fetch per project (default: 5)
        [--clear]           wipe previously fetched Wikimedia media first
        [--timeout 20]      per-request timeout in seconds
"""
from __future__ import annotations

import io
import time
import urllib.parse
import urllib.request

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image

from apps.heritage.models import Project
from apps.media.models import Media


# Targeted search terms per project title (matches PROJECT_BLUEPRINTS keys).
# Multiple terms = better coverage if the first one returns too few hits.
SEARCH_TERMS = {
    "Documentation de la Casbah d'Alger": [
        "Casbah of Algiers", "Casbah Alger", "Kasbah Algiers"
    ],
    "Atlas archéologique de Djémila": [
        "Djemila Algeria", "Cuicul", "Djémila ruins"
    ],
    "Plan urbanistique de Timgad": [
        "Timgad", "Thamugadi", "Trajan arch Timgad"
    ],
    "Architecture vernaculaire du M'Zab": [
        "Ghardaia", "M'Zab valley", "Beni Isguen"
    ],
    "Premier site UNESCO d'Algérie": [
        "Qal'a Beni Hammad", "Qalaa Beni Hammad", "Kalaa des Beni Hammad"
    ],
    "Complexe Sidi Boumediene à El-Eubbad": [
        "Sidi Boumediene mosque", "El Eubbad Tlemcen", "Sidi Boumediene Tlemcen"
    ],
    "Restauration et histoire de la Mosquée Ketchaoua": [
        "Ketchaoua Mosque", "Mosquée Ketchaoua", "Ketchaoua Algiers"
    ],
    "Palais Ahmed Bey de Constantine": [
        "Ahmed Bey Palace Constantine", "Palais Ahmed Bey", "Constantine palace"
    ],
    "Cité mérinide de Mansourah": [
        "Mansourah Tlemcen", "Mansurah minaret", "Mansourah mosque Tlemcen"
    ],
    "Mausolée royal de Maurétanie": [
        "Royal Mausoleum Mauretania", "Tombeau Chrétienne", "Kbour er Roumia"
    ],
}


USER_AGENT = "Patrimoine.dz Seed Bot/1.0 (educational; contact: demo@patrimoine.dz)"
API = "https://commons.wikimedia.org/w/api.php"


def _http_get_json(url: str, timeout: int) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        import json
        return json.loads(r.read().decode("utf-8"))


def _http_get_bytes(url: str, timeout: int) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _search_commons(term: str, limit: int, timeout: int) -> list[dict]:
    """Use Commons search API → returns list of {title, url, descriptionurl, license, author}."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{term} filetype:bitmap",
        "gsrnamespace": "6",  # File:
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": "1600",
    }
    url = f"{API}?{urllib.parse.urlencode(params)}"
    data = _http_get_json(url, timeout)
    pages = (data.get("query") or {}).get("pages") or {}
    out = []
    for _, page in pages.items():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        ii = infos[0]
        mime = ii.get("mime", "")
        if not mime.startswith("image/"):
            continue
        meta = ii.get("extmetadata") or {}
        out.append({
            "title": page.get("title"),
            "url": ii.get("thumburl") or ii.get("url"),
            "page_url": ii.get("descriptionurl"),
            "mime": mime,
            "license": (meta.get("LicenseShortName") or {}).get("value") or "Wikimedia Commons",
            "author": (meta.get("Artist") or {}).get("value") or "",
        })
    return out


class Command(BaseCommand):
    help = "Download real photos from Wikimedia Commons for each seeded project."

    def add_arguments(self, parser):
        parser.add_argument("--per-project", type=int, default=5,
                            help="Number of Wikimedia images to fetch per project (default: 5).")
        parser.add_argument("--clear", action="store_true",
                            help="Delete previously fetched Wikimedia media (caption starts with '[wiki]').")
        parser.add_argument("--timeout", type=int, default=20,
                            help="Per-request timeout in seconds (default: 20).")

    def handle(self, *args, **options):
        per = options["per_project"]
        timeout = options["timeout"]

        if options["clear"]:
            deleted, _ = Media.objects.filter(caption__startswith="[wiki]").delete()
            self.stdout.write(self.style.WARNING(
                f"Cleared {deleted} previously fetched Wikimedia media row(s)."
            ))

        projects = Project.objects.select_related("resource", "created_by").all()
        if not projects.exists():
            self.stderr.write(self.style.ERROR(
                "No projects found. Run `python manage.py seed_projects` first."
            ))
            return

        total_new = 0
        for project in projects:
            uploader = project.created_by
            if not uploader:
                continue

            existing = project.media.filter(caption__startswith="[wiki]").count()
            need = max(0, per - existing)
            if need == 0:
                self.stdout.write(
                    f"  · {project.title} — already has {existing} wiki image(s), skipping."
                )
                continue

            # Curated terms for the 10 iconic monuments; otherwise fall back to
            # the resource's own name (+ wilaya) which yields far better Commons
            # hits than the verbose project title.
            res = project.resource
            fallback = [res.name_fr, f"{res.name_fr} {res.wilaya}".strip(),
                        f"{res.name_fr} Algeria"]
            if res.name_ar:
                fallback.append(res.name_ar)
            terms = SEARCH_TERMS.get(project.title, fallback)

            # Aggregate candidates across multiple search terms, dedup by URL.
            candidates: list[dict] = []
            seen_urls: set[str] = set()
            for term in terms:
                try:
                    hits = _search_commons(term, limit=need * 3, timeout=timeout)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f"    × search '{term}' failed: {e}"
                    ))
                    continue
                for hit in hits:
                    u = hit.get("url")
                    if not u or u in seen_urls:
                        continue
                    seen_urls.add(u)
                    candidates.append(hit)
                if len(candidates) >= need:
                    break

            if not candidates:
                self.stdout.write(self.style.WARNING(
                    f"  × {project.title} — no Wikimedia images found."
                ))
                continue

            added = 0
            for cand in candidates:
                if added >= need:
                    break
                try:
                    raw = _http_get_bytes(cand["url"], timeout=timeout)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f"    × download failed ({cand['url']}): {e}"
                    ))
                    continue

                # Validate it's a real image and get dimensions.
                try:
                    img = Image.open(io.BytesIO(raw))
                    img.verify()  # quick header check
                    img = Image.open(io.BytesIO(raw))
                    width, height = img.size
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f"    × invalid image, skipping: {e}"
                    ))
                    continue

                # Force JPEG output for consistency.
                buf = io.BytesIO()
                rgb = img.convert("RGB")
                rgb.save(buf, format="JPEG", quality=85, optimize=True)
                data = buf.getvalue()

                title = cand.get("title", "File:Unknown.jpg").replace("File:", "")
                safe_name = f"wiki-{project.pk}-{existing + added + 1}.jpg"

                media = Media(
                    project=project,
                    uploader=uploader,
                    media_type=Media.Type.IMAGE,
                    mime_type="image/jpeg",
                    size_bytes=len(data),
                    width=width,
                    height=height,
                    caption=f"[wiki] {title}",
                    license=cand.get("license", "Wikimedia Commons"),
                    ai_status=Media.AiStatus.SKIPPED,
                )
                media.file.save(safe_name, ContentFile(data), save=True)
                added += 1
                total_new += 1

                # Be gentle with the Commons API.
                time.sleep(0.3)

            self.stdout.write(self.style.SUCCESS(
                f"  ✓ {project.title} — +{added} wiki image(s) "
                f"(total {existing + added})"
            ))

        self.stdout.write(self.style.SUCCESS(
            f"Done — {total_new} new image(s) downloaded from Wikimedia Commons."
        ))
