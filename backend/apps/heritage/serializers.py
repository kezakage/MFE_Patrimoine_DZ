from rest_framework import serializers

from apps.accounts.models import Discipline
from apps.accounts.serializers import DisciplineSerializer, UserMiniSerializer
from apps.media.models import Media

from .models import HeritageResource, Project, ProjectMember


class HeritageResourceSerializer(serializers.ModelSerializer):
    longitude = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()
    disciplines = DisciplineSerializer(many=True, read_only=True)

    class Meta:
        model = HeritageResource
        fields = (
            "id", "name_fr", "name_ar", "description",
            "period", "architectural_type",
            "wilaya", "commune", "address",
            "longitude", "latitude",
            "classification_level",
            "disciplines",
            "cover_image_url",
            "project",
            "created_at", "updated_at",
        )

    def get_longitude(self, obj):
        return obj.geo_point.x if obj.geo_point else None

    def get_latitude(self, obj):
        return obj.geo_point.y if obj.geo_point else None

    def get_cover_image_url(self, obj):
        # Canonical cover set on the resource takes priority.
        if obj.cover_image_url:
            return obj.cover_image_url
        # Otherwise fall back to the first image media of a linked project.
        from apps.media.models import Media
        media = (
            Media.objects
            .filter(project__resource=obj, media_type=Media.Type.IMAGE)
            .order_by("-created_at")
            .first()
        )
        if not media or not media.file:
            return None
        request = self.context.get("request")
        url = media.file.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_project(self, obj):
        """Summary of the 1↔1 linked collaborative project, for the public
        detail page: lets it surface the image gallery, member info, and the
        project id needed for the workspace link and PDF export."""
        try:
            proj = obj.project
        except Project.DoesNotExist:
            return None

        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        is_member = bool(
            user and user.is_authenticated
            and ProjectMember.objects.filter(project=proj, user=user).exists()
        )

        from apps.media.models import Media
        images = []
        media_qs = (
            Media.objects
            .filter(project=proj, media_type=Media.Type.IMAGE)
            .order_by("-created_at")[:12]
        )
        for m in media_qs:
            if not m.file:
                continue
            url = m.file.url
            if request is not None:
                url = request.build_absolute_uri(url)
            images.append({"id": m.id, "url": url, "caption": m.caption})

        return {
            "id": proj.id,
            "status": proj.status,
            "member_count": proj.memberships.count(),
            "is_member": is_member,
            "images": images,
        }


class HeritageResourceWriteSerializer(serializers.ModelSerializer):
    longitude = serializers.FloatField(write_only=True, required=False)
    latitude = serializers.FloatField(write_only=True, required=False)
    # Write-side: a list of Discipline PKs to attach.
    discipline_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False,
        queryset=Discipline.objects.all(), source="disciplines",
    )

    class Meta:
        model = HeritageResource
        fields = (
            "id", "name_fr", "name_ar", "description",
            "period", "architectural_type",
            "wilaya", "commune", "address",
            "longitude", "latitude",
            "classification_level",
            "discipline_ids",
            "cover_image_url",
        )

    def _set_point(self, instance, validated):
        from django.contrib.gis.geos import Point
        lng = validated.pop("longitude", None)
        lat = validated.pop("latitude", None)
        if lng is not None and lat is not None:
            instance.geo_point = Point(float(lng), float(lat))

    def create(self, validated_data):
        disciplines = validated_data.pop("disciplines", None)
        instance = HeritageResource(**{k: v for k, v in validated_data.items()
                                       if k not in ("longitude", "latitude")})
        self._set_point(instance, validated_data)
        instance.save()
        if disciplines is not None:
            instance.disciplines.set(disciplines)
        return instance

    def update(self, instance, validated_data):
        disciplines = validated_data.pop("disciplines", None)
        self._set_point(instance, validated_data)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if disciplines is not None:
            instance.disciplines.set(disciplines)
        return instance


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ProjectMember
        fields = ("id", "user", "user_id", "project_role", "joined_at")
        read_only_fields = ("joined_at",)


class ProjectSerializer(serializers.ModelSerializer):
    resource = HeritageResourceSerializer(read_only=True)
    resource_id = serializers.PrimaryKeyRelatedField(
        queryset=HeritageResource.objects.all(), source="resource", write_only=True
    )
    created_by = UserMiniSerializer(read_only=True)
    member_count = serializers.IntegerField(source="memberships.count", read_only=True)
    is_member = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    cover_media_id = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(), source="cover_media",
        write_only=True, required=False, allow_null=True,
    )
    media_count = serializers.IntegerField(source="media.count", read_only=True)

    class Meta:
        model = Project
        fields = (
            "id", "title", "description", "status",
            "resource", "resource_id",
            "created_by", "member_count", "is_member",
            "cover_image_url", "cover_media_id", "media_count",
            "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "created_by",
                            "member_count", "is_member",
                            "cover_image_url", "media_count")

    def get_cover_image_url(self, obj):
        media = obj.cover_media
        if media is None or not media.file:
            media = (
                Media.objects
                .filter(project=obj, media_type=Media.Type.IMAGE)
                .order_by("-created_at")
                .first()
            )
        if not media or not media.file:
            return None
        request = self.context.get("request")
        url = media.file.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_is_member(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        if not user or not user.is_authenticated:
            return False
        from .models import ProjectMember
        return ProjectMember.objects.filter(project=obj, user=user).exists()
