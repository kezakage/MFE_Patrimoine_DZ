from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Annotation, Media
from .serializers import (
    AnnotationSerializer,
    AnnotationWriteSerializer,
    MediaSerializer,
    MediaUploadSerializer,
)


class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.select_related("uploader", "project").all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["project", "media_type", "uploader"]
    search_fields = ["caption"]
    ordering_fields = ["created_at", "size_bytes"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return MediaUploadSerializer
        return MediaSerializer

    def perform_create(self, serializer):
        media = serializer.save(uploader=self.request.user)
        # async thumbnail generation
        try:
            from .tasks import generate_thumbnail
            generate_thumbnail.delay(media.id)
        except Exception:
            pass

    @action(detail=True, methods=["get"])
    def annotations(self, request, pk=None):
        media = self.get_object()
        qs = media.annotations.select_related("author", "discipline").all()
        return Response(AnnotationSerializer(qs, many=True, context={"request": request}).data)


class AnnotationViewSet(viewsets.ModelViewSet):
    queryset = Annotation.objects.select_related(
        "author", "discipline", "media", "resource", "validated_by",
    ).all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["media", "resource", "is_ai_generated", "is_validated", "discipline"]
    ordering_fields = ["created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AnnotationWriteSerializer
        return AnnotationSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def validate_annotation(self, request, pk=None):
        """Validate an AI-generated annotation."""
        annotation = self.get_object()
        annotation.is_validated = True
        annotation.validated_by = request.user
        annotation.save(update_fields=["is_validated", "validated_by"])
        return Response(AnnotationSerializer(annotation, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject (delete) an AI-generated annotation."""
        annotation = self.get_object()
        if not annotation.is_ai_generated:
            return Response(
                {"detail": "Only AI-generated annotations can be rejected via this endpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        annotation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
