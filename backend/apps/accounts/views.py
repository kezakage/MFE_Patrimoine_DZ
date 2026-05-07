from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Discipline, User
from .permissions import IsAdmin, IsSelfOrAdmin
from .serializers import (
    DisciplineSerializer,
    RegisterSerializer,
    TokenSerializer,
    UserSerializer,
    ValidateExpertSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = TokenSerializer


class RefreshView(TokenRefreshView):
    pass


class RegisterView(viewsets.GenericViewSet):
    """POST /auth/register/ — public sign-up."""
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeViewSet(viewsets.GenericViewSet):
    """GET/PATCH /auth/me/ — current user profile."""
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def list(self, request):
        return Response(UserSerializer(request.user).data)

    def partial_update(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DisciplineViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Discipline.objects.all()
    serializer_class = DisciplineSerializer
    permission_classes = (IsAuthenticated,)


class UserAdminViewSet(viewsets.ModelViewSet):
    """
    Admin-only management of users. Includes the `validate` action which
    handles the workflow:
        - approve  → status=ACTIVE, sets validated_by/at
        - reject   → status=REJECTED
    """
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer
    permission_classes = (IsAdmin,)
    filterset_fields = ("role", "status")
    search_fields = ("email", "first_name", "last_name", "institution_name")

    @action(detail=True, methods=["post"], url_path="validate")
    def validate(self, request, pk=None):
        user = self.get_object()
        ser = ValidateExpertSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        if ser.validated_data["decision"] == "approve":
            user.status = User.Status.ACTIVE
            user.validated_by = request.user
            user.validated_at = timezone.now()
        else:
            user.status = User.Status.REJECTED
        user.save(update_fields=["status", "validated_by", "validated_at"])
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        user = self.get_object()
        user.status = User.Status.REJECTED
        user.is_active = False
        user.save(update_fields=["status", "is_active"])
        return Response(UserSerializer(user).data)
