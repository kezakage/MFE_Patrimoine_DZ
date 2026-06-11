"""
Locust load test for PatrimoineHub — simulates concurrent public visitors
browsing the heritage catalogue and exercising the Elasticsearch search
stack (MFE target: hold 50+ simultaneous users with acceptable latency).

The scenario hits only AllowAny read endpoints so no auth/seeding handshake
is needed; it mirrors the real "public space" traffic pattern (catalogue
browsing dominates, search is frequent, map/geojson and chatbot are rarer).

Run (headless, 50 users, ramp 5/s, 2 min) against a running stack:

    pip install locust
    locust -f loadtest/locustfile.py --host http://localhost:8000 \
           --headless -u 50 -r 5 -t 2m \
           --csv loadtest/results --html loadtest/report.html

Or interactively (web UI on :8089):

    locust -f loadtest/locustfile.py --host http://localhost:8000
"""
from __future__ import annotations

import random

from locust import HttpUser, between, task

_API = "/api/v1/heritage"

# Representative bilingual query terms drawn from the seeded corpus.
_QUERIES = [
    "casbah", "mosquée", "timgad", "tipaza", "mzab", "ottoman",
    "minaret", "médina", "ruines", "fort", "palais", "قصبة", "مسجد",
]
_PERIODS = ["roman", "ottoman", "berber", "french_colonial", "numidian"]
_TYPES = ["mosque", "casbah", "fortification", "archaeological_site", "palace"]


class PublicVisitor(HttpUser):
    """A logged-out visitor browsing the catalogue and searching."""

    # Human-like think time between actions.
    wait_time = between(1, 4)

    # Cache of resource/project ids discovered from list responses, so detail
    # views target real objects instead of guessing ids.
    def on_start(self):
        self.resource_ids: list[int] = []
        self.project_ids: list[int] = []
        self._refresh_ids()

    def _refresh_ids(self):
        try:
            r = self.client.get(f"{_API}/resources/?page_size=20", name="resources:list")
            if r.ok:
                data = r.json()
                rows = data.get("results", data) if isinstance(data, dict) else data
                self.resource_ids = [x["id"] for x in rows if isinstance(x, dict) and "id" in x][:20]
            p = self.client.get(f"{_API}/projects/?page_size=20", name="projects:list")
            if p.ok:
                data = p.json()
                rows = data.get("results", data) if isinstance(data, dict) else data
                self.project_ids = [x["id"] for x in rows if isinstance(x, dict) and "id" in x][:20]
        except Exception:
            pass

    @task(8)
    def browse_resources(self):
        # Pages 1-2 only: the seeded catalogue spans ~2 pages of 20, and DRF
        # returns 404 for out-of-range pages.
        page = random.randint(1, 2)
        self.client.get(f"{_API}/resources/?page={page}", name="resources:list")

    @task(6)
    def search(self):
        q = random.choice(_QUERIES)
        mode = random.choice(["keyword", "keyword", "hybrid"])
        self.client.get(
            f"{_API}/resources/search/?q={q}&mode={mode}&size=20",
            name="resources:search",
        )

    @task(4)
    def faceted_search(self):
        params = f"?period={random.choice(_PERIODS)}&architectural_type={random.choice(_TYPES)}"
        self.client.get(f"{_API}/resources/search/{params}", name="resources:facets")

    @task(3)
    def autocomplete(self):
        q = random.choice(_QUERIES)[:4]
        self.client.get(f"{_API}/resources/suggest/?q={q}", name="resources:suggest")

    @task(3)
    def resource_detail(self):
        if not self.resource_ids:
            self._refresh_ids()
            return
        rid = random.choice(self.resource_ids)
        self.client.get(f"{_API}/resources/{rid}/", name="resources:detail")

    @task(2)
    def map_geojson(self):
        self.client.get(f"{_API}/resources/geojson/", name="resources:geojson")

    @task(2)
    def browse_projects(self):
        self.client.get(f"{_API}/projects/", name="projects:list")

    @task(1)
    def project_detail(self):
        if not self.project_ids:
            self._refresh_ids()
            return
        pid = random.choice(self.project_ids)
        self.client.get(f"{_API}/projects/{pid}/", name="projects:detail")
