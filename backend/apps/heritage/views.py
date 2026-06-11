from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from drf_spectacular.utils import extend_schema
from elasticsearch_dsl import Q as ESQ
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsExpertOrReadOnly

from .documents import HeritageResourceDocument
from .filters import HeritageResourceFilter, ProjectFilter
from .models import HeritageResource, Project, ProjectMember
from .services.cidoc_crm import resource_to_cidoc
from .services.iiif import project_to_manifest
from .permissions import IsProjectMemberOrReadOnlyPublic
from .serializers import (
    HeritageResourceSerializer,
    HeritageResourceWriteSerializer,
    ProjectMemberSerializer,
    ProjectSerializer,
)


class HeritageResourceViewSet(viewsets.ModelViewSet):
    """Catalog of architectural heritage resources (monuments)."""
    queryset = HeritageResource.objects.all()
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsExpertOrReadOnly)
    filterset_class = HeritageResourceFilter
    search_fields = ("name_fr", "name_ar", "description", "wilaya", "commune")
    ordering_fields = ("name_fr", "created_at", "updated_at")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return HeritageResourceWriteSerializer
        return HeritageResourceSerializer

    @action(detail=False, methods=["get"], url_path="geojson", permission_classes=[permissions.AllowAny])
    def geojson(self, request):
        """
        FeatureCollection of all heritage resources with a geo_point.
        Lightweight payload tailored for Leaflet markers.
        """
        qs = HeritageResource.objects.exclude(geo_point__isnull=True)
        # Allow the same filterset (period/wilaya/...) to apply
        qs = self.filter_queryset(qs)
        features = []
        for r in qs:
            features.append({
                "type": "Feature",
                "id": r.id,
                "geometry": {
                    "type": "Point",
                    "coordinates": [r.geo_point.x, r.geo_point.y],
                },
                "properties": {
                    "name_fr": r.name_fr,
                    "name_ar": r.name_ar,
                    "wilaya": r.wilaya,
                    "commune": r.commune,
                    "period": r.period,
                    "architectural_type": r.architectural_type,
                    "classification_level": r.classification_level,
                },
            })
        return Response({"type": "FeatureCollection", "features": features})

    @action(detail=False, methods=["get"], url_path="full-text")
    def full_text(self, request):
        """PostgreSQL full-text search across name + description (legacy fallback)."""
        q = request.query_params.get("q", "").strip()
        if not q:
            return Response([])
        vector = SearchVector("name_fr", "description", config="french")
        query = SearchQuery(q, config="french")
        qs = (
            HeritageResource.objects.annotate(rank=SearchRank(vector, query))
            .filter(rank__gt=0)
            .order_by("-rank")[:50]
        )
        return Response(HeritageResourceSerializer(qs, many=True).data)

    # Facets returned by /search/ — single source of truth so the response
    # shape stays consistent across modes (keyword / semantic / hybrid).
    SEARCH_FACETS = (
        "period",
        "architectural_type",
        "classification_level",
        "wilaya",
        "disciplines",
    )

    @action(detail=False, methods=["get"], url_path="search", permission_classes=[permissions.AllowAny])
    def es_search(self, request):
        """
        Search heritage resources with multilingual matching, multidimensional
        facet filters (period / architectural type / wilaya / discipline),
        highlights, and an optional semantic-rerank pass on the top candidates.

        Query params:
          q: full-text query (matched against name_fr, name_ar, description, wilaya.text, commune)
          period, architectural_type, classification_level, wilaya, disciplines:
                  multi-valued OR filters (repeat the param to OR more values)
          mode:   "keyword" (default) — pure Elasticsearch BM25
                  "hybrid"           — ES retrieves N candidates, pgvector reranks
                                       them by cosine similarity to a dense
                                       embedding of `q` and blends scores
                  "semantic"         — pgvector cosine ranking on the whole
                                       filtered set (no ES scoring)
          page, size: pagination (default page=1, size=20, max size=100)
        """
        q = request.query_params.get("q", "").strip()
        mode = (request.query_params.get("mode") or "keyword").lower()
        if mode not in {"keyword", "hybrid", "semantic"}:
            mode = "keyword"
        try:
            page = max(int(request.query_params.get("page", 1)), 1)
            size = min(max(int(request.query_params.get("size", 20)), 1), 100)
        except ValueError:
            page, size = 1, 20

        s = HeritageResourceDocument.search()

        if q and mode != "semantic":
            # cross_fields lets a single query token match across the multilingual fields
            s = s.query(
                "multi_match",
                query=q,
                fields=[
                    "name_fr^3", "name_fr.keyword^4",
                    "name_ar^3", "name_ar.keyword^4",
                    "description",
                    "wilaya.text", "commune",
                ],
                type="best_fields",
                fuzziness="AUTO",
            )

        # OR-style facet filters (multi-valued query params). Includes the new
        # `disciplines` facet (contributing scientific disciplines).
        for facet in self.SEARCH_FACETS:
            values = request.query_params.getlist(facet)
            if values:
                s = s.filter("terms", **{facet: values})

        # Aggregations (facets) — computed against the *filtered* set
        s.aggs.bucket("period", "terms", field="period", size=20)
        s.aggs.bucket("architectural_type", "terms", field="architectural_type", size=30)
        s.aggs.bucket("classification_level", "terms", field="classification_level", size=10)
        s.aggs.bucket("wilaya", "terms", field="wilaya", size=60)
        s.aggs.bucket("disciplines", "terms", field="disciplines", size=30)

        # Highlights — returned only for fields that actually matched
        s = s.highlight_options(pre_tags=["<mark>"], post_tags=["</mark>"], number_of_fragments=2)
        s = s.highlight("name_fr", "name_ar", "description")

        # In hybrid mode we fetch a wider candidate pool then rerank with the
        # embedding model; in semantic mode ES is used only for facet filtering.
        if mode == "hybrid" and q:
            candidate_size = max(size * 4, 60)
            s = s[0:candidate_size]
        elif mode == "semantic" and q:
            # We don't need ES to score documents — just to apply facet filters
            # against the index. Cap to avoid huge transfers.
            candidate_size = 200
            s = s[0:candidate_size]
        else:
            start = (page - 1) * size
            s = s[start:start + size]

        try:
            response = s.execute()
        except Exception as exc:  # ES unavailable, etc. — degrade gracefully
            return Response(
                {"error": "search_unavailable", "detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Build per-id source map so reranking can return them in a new order
        # without re-hitting ES.
        hits_by_id = {}
        for hit in response:
            src = hit.to_dict()
            hits_by_id[int(hit.meta.id)] = {
                "id": int(hit.meta.id),
                "es_score": hit.meta.score,
                "name_fr": src.get("name_fr"),
                "name_ar": src.get("name_ar"),
                "description": src.get("description"),
                "period": src.get("period"),
                "architectural_type": src.get("architectural_type"),
                "classification_level": src.get("classification_level"),
                "wilaya": src.get("wilaya"),
                "commune": src.get("commune"),
                "disciplines": src.get("disciplines") or [],
                "location": src.get("location"),
                "highlight": getattr(hit.meta, "highlight", {}).to_dict()
                if hasattr(getattr(hit.meta, "highlight", None), "to_dict") else {},
            }

        # Semantic / hybrid rerank: replace ordering by combined score.
        rerank_applied = False
        if q and mode in {"hybrid", "semantic"}:
            try:
                # Local import: keeps the embedding model load out of the cold
                # request path when `mode=keyword` (the default).
                from .services.semantic import semantic_rerank
                candidate_ids = list(hits_by_id.keys()) or None
                ranked = semantic_rerank(q, candidate_ids, top_k=max(size, len(hits_by_id) or 0))
            except Exception:  # model load failure → fall back gracefully
                ranked = []
            if ranked:
                rerank_applied = True
                # Cosine distance ∈ [0,2] → similarity ∈ [-1,1]; clip negatives.
                max_es = max((h["es_score"] or 0.0) for h in hits_by_id.values()) or 1.0
                ordered = []
                for rid, dist in ranked:
                    base = hits_by_id.get(rid)
                    if not base:
                        continue
                    sim = max(0.0, 1.0 - dist)
                    if mode == "hybrid":
                        combined = 0.5 * (base["es_score"] / max_es) + 0.5 * sim
                    else:  # semantic
                        combined = sim
                    base = dict(base)
                    base["semantic_score"] = sim
                    base["score"] = combined
                    ordered.append(base)
                ordered.sort(key=lambda r: r["score"], reverse=True)
                # Manual pagination over the reranked list.
                total_after_rerank = len(ordered)
                start = (page - 1) * size
                page_items = ordered[start:start + size]
                # Strip the internal es_score key to keep response stable.
                results = [{k: v for k, v in r.items() if k != "es_score"} for r in page_items]
                facets = self._extract_facets(response)
                return Response({
                    "total": total_after_rerank,
                    "page": page,
                    "size": size,
                    "mode": mode,
                    "rerank_applied": True,
                    "results": results,
                    "facets": facets,
                })

        # Keyword path (default) or graceful fallback when rerank failed.
        results = []
        for h in hits_by_id.values():
            r = {k: v for k, v in h.items() if k != "es_score"}
            r["score"] = h["es_score"]
            results.append(r)

        return Response({
            "total": response.hits.total.value,
            "page": page,
            "size": size,
            "mode": "keyword" if not rerank_applied else mode,
            "rerank_applied": rerank_applied,
            "results": results,
            "facets": self._extract_facets(response),
        })

    @staticmethod
    def _extract_facets(response) -> dict:
        """Pull bucket counts out of an ES response; tolerate missing aggs."""
        out = {}
        for name in HeritageResourceViewSet.SEARCH_FACETS:
            try:
                buckets = response.aggregations[name].buckets
            except (KeyError, AttributeError):
                buckets = []
            out[name] = [{"key": b.key, "count": b.doc_count} for b in buckets]
        return out

    @action(detail=False, methods=["get"], url_path="suggest", permission_classes=[permissions.AllowAny])
    def suggest(self, request):
        """Autocomplete on resource names (uses ES completion suggester on name_fr.suggest)."""
        prefix = request.query_params.get("q", "").strip()
        if not prefix:
            return Response([])
        size = min(max(int(request.query_params.get("size", 10) or 10), 1), 25)

        s = HeritageResourceDocument.search()
        s = s.suggest(
            "name_suggest",
            prefix,
            completion={"field": "name_fr.suggest", "size": size, "skip_duplicates": True},
        )
        try:
            response = s.execute()
        except Exception as exc:
            return Response(
                {"error": "search_unavailable", "detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        out = []
        for option in response.suggest.name_suggest[0].options:
            out.append({
                "id": int(option._id),
                "text": option.text,
                "score": option._score,
            })
        return Response(out)

    @action(
        detail=True,
        methods=["get"],
        url_path="cidoc-crm",
        permission_classes=[permissions.AllowAny],
    )
    def cidoc_crm(self, request, pk=None):
        """CIDOC-CRM v7.2 JSON-LD representation of this resource."""
        resource = self.get_object()
        return Response(
            resource_to_cidoc(resource),
            content_type="application/ld+json",
        )


class ProjectViewSet(viewsets.ModelViewSet):
    """
    Collaborative projects.
    - List: published projects (public) + projects the user is member of.
    - Create: any authenticated expert/admin.
    - Update/Delete: project members or admins.
    """
    serializer_class = ProjectSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsProjectMemberOrReadOnlyPublic)
    filterset_class = ProjectFilter
    search_fields = ("title", "description")
    ordering_fields = ("title", "updated_at", "created_at")

    def get_queryset(self):
        u = self.request.user
        if not u.is_authenticated:
            return Project.objects.filter(status=Project.Status.PUBLISHED).select_related("resource", "created_by")
        if u.role == "admin":
            return Project.objects.all().select_related("resource", "created_by")
        return (
            Project.objects.filter(
                models_or_query(self, u)
            ).distinct().select_related("resource", "created_by")
        )

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        ProjectMember.objects.create(
            project=project,
            user=self.request.user,
            project_role=ProjectMember.ProjectRole.LEAD,
        )

    @action(detail=True, methods=["get", "post"], url_path="members")
    def members(self, request, pk=None):
        project = self.get_object()
        if request.method == "GET":
            qs = project.memberships.select_related("user")
            return Response(ProjectMemberSerializer(qs, many=True).data)

        ser = ProjectMemberSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        member = ProjectMember.objects.create(project=project, **ser.validated_data)
        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"members/(?P<user_id>\d+)")
    def remove_member(self, request, pk=None, user_id=None):
        project = self.get_object()
        ProjectMember.objects.filter(project=project, user_id=user_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path="join",
        permission_classes=[permissions.IsAuthenticated],
    )
    def join(self, request, pk=None):
        """Any authenticated user may join a PUBLISHED project as a contributor."""
        # Bypass IsProjectMemberOrReadOnlyPublic by fetching directly.
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        if project.status != Project.Status.PUBLISHED:
            return Response(
                {"detail": "This project is not open to new contributors."},
                status=status.HTTP_403_FORBIDDEN,
            )

        member, created = ProjectMember.objects.get_or_create(
            project=project,
            user=request.user,
            defaults={"project_role": ProjectMember.ProjectRole.CONTRIBUTOR},
        )
        return Response(
            ProjectMemberSerializer(member).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Publish a project to the public space",
        description=(
            "Transitions the project's `status` to `PUBLISHED`, making it visible "
            "on the public map and explore pages. Idempotent: re-publishing an already "
            "published project is a no-op and does not re-notify members. On the first "
            "transition, every project member receives a real-time WebSocket notification."
        ),
        request=None,
        responses={200: ProjectSerializer},
        tags=["projects"],
    )
    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        project = self.get_object()
        was_published = project.status == Project.Status.PUBLISHED
        project.status = Project.Status.PUBLISHED
        project.save(update_fields=["status", "updated_at"])
        # Notify project members on the transition (avoid spamming on idempotent re-publish).
        if not was_published:
            try:
                from apps.notifications.utils import notify_project_published
                notify_project_published(project)
            except Exception:
                pass
        return Response(ProjectSerializer(project).data)

    @action(
        detail=True,
        methods=["get"],
        url_path="iiif/manifest",
        permission_classes=[permissions.AllowAny],
    )
    def iiif_manifest(self, request, pk=None):
        """IIIF Presentation 3.0 manifest of the project's images.

        Visibility follows ``get_queryset``: anonymous users only reach
        published projects; members reach their own unpublished ones.
        """
        project = self.get_object()
        return Response(
            project_to_manifest(project, request),
            content_type="application/ld+json",
        )


def models_or_query(view, user):
    """Helper kept here to avoid a circular import on Q at module load."""
    from django.db.models import Q
    return Q(status=Project.Status.PUBLISHED) | Q(memberships__user=user)
