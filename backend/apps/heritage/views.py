from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsExpertOrReadOnly

from .filters import HeritageResourceFilter, ProjectFilter
from .models import HeritageResource, Project, ProjectMember
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

    @action(detail=False, methods=["get"], url_path="full-text")
    def full_text(self, request):
        """PostgreSQL full-text search across name + description."""
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

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        project = self.get_object()
        project.status = Project.Status.PUBLISHED
        project.save(update_fields=["status", "updated_at"])
        return Response(ProjectSerializer(project).data)


def models_or_query(view, user):
    """Helper kept here to avoid a circular import on Q at module load."""
    from django.db.models import Q
    return Q(status=Project.Status.PUBLISHED) | Q(memberships__user=user)
