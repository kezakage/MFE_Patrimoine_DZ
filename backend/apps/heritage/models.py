"""
Heritage resources and collaborative projects.

Schema (simplified, per project context):
  - HeritageResource (geo_point via PostGIS)
  - Project (1 ↔ 1 with HeritageResource)
  - ProjectMember (M2M with role per project)
"""
from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _
from pgvector.django import HnswIndex, VectorField

# Dimension of paraphrase-multilingual-mpnet-base-v2 (FR + AR, 768 dims).
# Kept identical to the chatbot's KnowledgeChunk so both reuse one model load.
HERITAGE_EMBEDDING_DIM = 768


class HeritageResource(models.Model):
    class Period(models.TextChoices):
        PREHISTORIC = "prehistoric", _("Prehistoric")
        NUMIDIAN = "numidian", _("Numidian")
        ROMAN = "roman", _("Roman")
        MEDIEVAL = "medieval", _("Medieval")
        OTTOMAN = "ottoman", _("Ottoman")
        COLONIAL = "colonial", _("Colonial")
        CONTEMPORARY = "contemporary", _("Contemporary")

    class ArchitecturalType(models.TextChoices):
        MOSQUE = "mosque", _("Mosque")
        MEDERSA = "medersa", _("Medersa")
        CASBAH = "casbah", _("Casbah / Medina")
        PALACE = "palace", _("Palace")
        FORTIFICATION = "fortification", _("Fortification")
        CHURCH = "church", _("Church")
        SYNAGOGUE = "synagogue", _("Synagogue")
        MAUSOLEUM = "mausoleum", _("Mausoleum")
        TRADITIONAL_HOUSE = "traditional_house", _("Traditional house")
        ARCHAEOLOGICAL_SITE = "archaeological_site", _("Archaeological site")
        OTHER = "other", _("Other")

    class ClassificationLevel(models.TextChoices):
        UNESCO = "unesco", _("UNESCO World Heritage")
        NATIONAL = "national", _("National")
        REGIONAL = "regional", _("Regional")
        UNCLASSIFIED = "unclassified", _("Unclassified")

    name_fr = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    # Canonical cover image for the resource (independent of any project Media).
    # A plain URL keeps demos offline-friendly (browser-cached) and leaves room
    # for a future IIIF manifest reference. Falls back to project Media if empty.
    cover_image_url = models.URLField(max_length=500, blank=True, default="")

    period = models.CharField(max_length=20, choices=Period.choices, db_index=True)
    architectural_type = models.CharField(max_length=24, choices=ArchitecturalType.choices, db_index=True)

    wilaya = models.CharField(max_length=80, db_index=True)
    commune = models.CharField(max_length=80, blank=True)
    address = models.CharField(max_length=255, blank=True)

    # PostGIS POINT (longitude, latitude)
    geo_point = gis_models.PointField(geography=True, null=True, blank=True)

    classification_level = models.CharField(
        max_length=14, choices=ClassificationLevel.choices,
        default=ClassificationLevel.UNCLASSIFIED, db_index=True,
    )

    # Contributing scientific disciplines relevant to this resource (architecture,
    # archaeology, history, ...). Used as a search facet and to colour-code
    # contributions in the editor. Sourced from the accounts.Discipline catalog
    # so admins/experts keep a single canonical list.
    disciplines = models.ManyToManyField(
        "accounts.Discipline",
        related_name="heritage_resources",
        blank=True,
    )

    # Dense semantic embedding of `name_fr + " — " + description`, produced by
    # the same multilingual sentence-transformers model used by the chatbot.
    # Nullable: backfilled by the `embed_heritage` management command (or the
    # admin re-embed action) — the legacy keyword search path works without it.
    embedding = VectorField(
        dimensions=HERITAGE_EMBEDDING_DIM, null=True, blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name_fr",)
        indexes = [
            models.Index(fields=["period", "architectural_type"]),
            # HNSW index makes cosine kNN search O(log N). m / ef_construction
            # mirror the chatbot's KnowledgeChunk index for consistency.
            HnswIndex(
                name="heritage_embedding_hnsw",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return self.name_fr


class Project(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        IN_PROGRESS = "in_progress", _("In progress")
        PUBLISHED = "published", _("Published")
        ARCHIVED = "archived", _("Archived")

    resource = models.OneToOneField(
        HeritageResource, on_delete=models.PROTECT, related_name="project"
    )
    title = models.CharField(max_length=240)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=14, choices=Status.choices, default=Status.DRAFT, db_index=True
    )

    cover_media = models.ForeignKey(
        "media_app.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Image chosen as the project's main photo.",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_projects"
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ProjectMember",
        related_name="projects",
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [models.Index(fields=["status", "updated_at"])]

    def __str__(self) -> str:  # pragma: no cover
        return self.title


class ProjectMember(models.Model):
    """Membership with a per-project role."""

    class ProjectRole(models.TextChoices):
        LEAD = "lead", _("Project lead")
        CONTRIBUTOR = "contributor", _("Contributor")
        REVIEWER = "reviewer", _("Reviewer")

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    project_role = models.CharField(max_length=14, choices=ProjectRole.choices, default=ProjectRole.CONTRIBUTOR)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "user")
        ordering = ("joined_at",)
