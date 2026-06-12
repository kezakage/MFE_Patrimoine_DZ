from django.utils import timezone
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
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
    """POST /auth/register/ — public sign-up.

    The new account is created with `status=PENDING_EMAIL`. A signed token is
    sent to the supplied address; the user must click the link before they can
    log in.
    """
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        try:
            from .services.email_verification import send_verification_email
            send_verification_email(user)
        except Exception:
            # Don't leak SMTP errors to the client; the user can request a
            # resend from the UI. Log via Django's default error handler.
            import logging
            logging.getLogger(__name__).exception("Verification email failed")
        return Response(
            {
                **UserSerializer(user).data,
                "detail": "Un email de confirmation a été envoyé. Vérifiez votre boîte de réception.",
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """
    POST /auth/verify-email/  body: {"token": "..."}

    Validates the signed token, marks the address as verified, and transitions
    the user out of PENDING_EMAIL. Re-presenting an already-consumed token is
    treated as success so a double-click in the email client is not surfaced
    as an error.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        from .services.email_verification import read_token, mark_email_verified

        token = str(request.data.get("token", "")).strip()
        user_id = read_token(token)
        if user_id is None:
            return Response(
                {"detail": "Lien invalide ou expiré.", "code": "invalid_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(pk=user_id).first()
        if not user:
            return Response(
                {"detail": "Compte introuvable.", "code": "user_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        already = bool(user.email_verified_at)
        mark_email_verified(user)
        return Response({
            "detail": "Email déjà confirmé." if already else "Email confirmé avec succès.",
            "status": user.status,
            "role": user.role,
        })


class ResendVerificationView(APIView):
    """
    POST /auth/resend-verification/  body: {"email": "..."}

    Always returns 200 with a generic message, regardless of whether an account
    exists or is already verified. This prevents email enumeration. The server
    enforces a 60-second per-account cooldown inside `send_verification_email`,
    AND a 5/hour per-IP rate limit via django-ratelimit to throttle abuse.
    """
    permission_classes = (AllowAny,)

    @method_decorator(ratelimit(key="ip", rate="5/h", method="POST", block=True))
    def post(self, request):
        from .services.email_verification import send_verification_email

        email = str(request.data.get("email", "")).strip().lower()
        if email:
            user = User.objects.filter(
                email__iexact=email, email_verified_at__isnull=True
            ).first()
            if user:
                try:
                    send_verification_email(user)
                except Exception:
                    import logging
                    logging.getLogger(__name__).exception("Resend failed")
        return Response({
            "detail": "Si un compte non confirmé existe pour cet email, un nouveau lien vient d'être envoyé.",
        })


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

    @extend_schema(
        summary="Approve or reject an expert account request",
        description=(
            "Admin-only. Transitions a user's `status` to either `ACTIVE` (on approve) or "
            "`REJECTED` (on reject). On success, a real-time WebSocket notification is "
            "pushed to the user via `/ws/notifications/` so the frontend can display a toast."
        ),
        request=ValidateExpertSerializer,
        responses={200: UserSerializer},
        examples=[
            OpenApiExample("Approve", value={"decision": "approve"}),
            OpenApiExample("Reject", value={"decision": "reject", "note": "Profil incomplet"}),
        ],
        tags=["admin"],
    )
    @action(detail=True, methods=["post"], url_path="validate")
    def validate(self, request, pk=None):
        user = self.get_object()
        ser = ValidateExpertSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        approved = ser.validated_data["decision"] == "approve"
        if approved:
            user.status = User.Status.ACTIVE
            user.validated_by = request.user
            user.validated_at = timezone.now()
        else:
            user.status = User.Status.REJECTED
        user.save(update_fields=["status", "validated_by", "validated_at"])

        # Push real-time WS notification to the user being validated.
        try:
            from apps.notifications.utils import notify_expert_decision
            notify_expert_decision(user, approved=approved)
        except Exception:
            pass
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        user = self.get_object()
        user.status = User.Status.REJECTED
        user.is_active = False
        user.save(update_fields=["status", "is_active"])
        return Response(UserSerializer(user).data)

    def destroy(self, request, *args, **kwargs):
        """Permanently delete a user account.

        Two safeguards:
          - Admins cannot delete their own account — that would lock them out
            and risk leaving the platform with no administrator.
          - Many records (projects, page versions, discussions, media,
            annotations…) reference the user with ``on_delete=PROTECT``. A hard
            delete of an active contributor would raise ``ProtectedError``; we
            translate that into a clean 409 with guidance to suspend instead.
        """
        from django.db.models import ProtectedError

        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "Vous ne pouvez pas supprimer votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Impossible de supprimer cet utilisateur : il a des "
                        "contributions liées (projets, médias, discussions…). "
                        "Suspendez plutôt son compte."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )


class TwoFactorSetupView(APIView):
    """
    POST /auth/2fa/setup/
    Generates a fresh TOTP secret for the current user and returns the
    `otpauth://` provisioning URI. The frontend renders it as a QR code that
    the user scans with Google Authenticator / Authy. 2FA is NOT yet active —
    the user must confirm a code via /2fa/enable/ first.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        import pyotp

        secret = pyotp.random_base32()
        request.user.totp_secret = secret
        # A new setup invalidates any previously active 2FA until re-confirmed.
        request.user.two_factor_enabled = False
        request.user.save(update_fields=["totp_secret", "two_factor_enabled"])
        otpauth_url = pyotp.TOTP(secret).provisioning_uri(
            name=request.user.email, issuer_name="PatrimoineHub"
        )
        return Response({"secret": secret, "otpauth_url": otpauth_url})


class TwoFactorEnableView(APIView):
    """
    POST /auth/2fa/enable/  body: {"otp": "123456"}
    Confirms the user can read a valid code from their authenticator, then
    flips two_factor_enabled on.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        import pyotp

        user = request.user
        if not user.totp_secret:
            return Response(
                {"detail": "Aucune configuration 2FA en cours. Lancez d'abord la configuration."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        otp = str(request.data.get("otp", "")).strip()
        if not pyotp.TOTP(user.totp_secret).verify(otp, valid_window=1):
            return Response({"detail": "Code invalide."}, status=status.HTTP_400_BAD_REQUEST)
        user.two_factor_enabled = True
        user.save(update_fields=["two_factor_enabled"])
        return Response({"enabled": True})


class TwoFactorDisableView(APIView):
    """
    POST /auth/2fa/disable/  body: {"otp": "123456"}
    Turns 2FA off and wipes the secret. A valid code is required while 2FA is
    active so a hijacked session cannot silently strip the protection.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        import pyotp

        user = request.user
        if user.two_factor_enabled and user.totp_secret:
            otp = str(request.data.get("otp", "")).strip()
            if not pyotp.TOTP(user.totp_secret).verify(otp, valid_window=1):
                return Response({"detail": "Code invalide."}, status=status.HTTP_400_BAD_REQUEST)
        user.two_factor_enabled = False
        user.totp_secret = ""
        user.save(update_fields=["two_factor_enabled", "totp_secret"])
        return Response({"enabled": False})


class AdminStatsView(APIView):
    """
    GET /auth/admin/stats/
    Admin-only aggregated platform statistics:
      - user counts by status
      - project / discussion counts
      - list of pending expert requests (name, institution, disciplines)
    All computed in 4 DB queries — safe to call on every dashboard mount.
    """
    permission_classes = (IsAdmin,)

    def get(self, request):
        from apps.heritage.models import Project  # avoid circular import
        from apps.discussions.models import Discussion

        total_users = User.objects.count()
        pending_users = User.objects.filter(status=User.Status.PENDING).count()
        active_users = User.objects.filter(status=User.Status.ACTIVE).count()

        total_projects = Project.objects.count()
        open_conflicts = Discussion.objects.filter(status=Discussion.Status.OPEN).count()

        pending_experts = User.objects.filter(
            status=User.Status.PENDING
        ).prefetch_related("disciplines").order_by("created_at")[:10]

        experts_data = [
            {
                "id": u.id,
                "full_name": f"{u.first_name} {u.last_name}".strip() or u.email,
                "email": u.email,
                "institution": u.institution_name or "",
                "disciplines": [d.name_fr for d in u.disciplines.all()],
                "created_at": u.created_at.isoformat(),
            }
            for u in pending_experts
        ]

        return Response({
            "total_users": total_users,
            "pending_users": pending_users,
            "active_users": active_users,
            "total_projects": total_projects,
            "open_conflicts": open_conflicts,
            "pending_experts": experts_data,
        })
