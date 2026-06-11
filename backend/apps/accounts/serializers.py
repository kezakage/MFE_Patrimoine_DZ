from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Discipline, User, UserDiscipline


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ("id", "name_fr", "name_ar", "color_hex")


class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user representation, embedded in many resources."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "role", "status")
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    disciplines = DisciplineSerializer(many=True, read_only=True)
    discipline_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False,
        queryset=Discipline.objects.all(), source="disciplines",
    )

    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name", "full_name",
            "role", "status", "is_active", "bio", "institution_name",
            "disciplines", "discipline_ids",
            "two_factor_enabled",
            "validated_at", "created_at", "last_login_at",
        )
        read_only_fields = ("role", "status", "is_active", "two_factor_enabled",
                            "validated_at", "created_at", "last_login_at")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    discipline_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False,
        queryset=Discipline.objects.all(),
    )
    requested_role = serializers.ChoiceField(
        choices=[User.Role.RESEARCHER, User.Role.EXPERT],
        default=User.Role.RESEARCHER,
        write_only=True,
    )

    class Meta:
        model = User
        fields = (
            "email", "password", "first_name", "last_name",
            "institution_name", "bio", "discipline_ids", "requested_role",
        )

    def validate_email(self, value: str) -> str:
        """
        Level-1 check: syntax + DNS/MX lookup via `email-validator`. Rejects
        obvious typos (gmial.com), bogus TLDs, and domains with no MX record
        before we burn a slot of the SMTP rate budget on a doomed send.
        """
        from email_validator import EmailNotValidError, validate_email
        try:
            info = validate_email(value, check_deliverability=True)
        except EmailNotValidError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        return info.normalized.lower()

    def create(self, validated_data):
        disciplines = validated_data.pop("discipline_ids", [])
        requested = validated_data.pop("requested_role")
        # Every new account starts in PENDING_EMAIL — the post-confirmation
        # transition happens in `services.email_verification.mark_email_verified`
        # (experts → PENDING for admin review, others → ACTIVE).
        user = User.objects.create_user(
            **validated_data,
            role=requested,
            status=User.Status.PENDING_EMAIL,
        )
        for d in disciplines:
            UserDiscipline.objects.create(user=user, discipline=d)
        return user


class TokenSerializer(TokenObtainPairSerializer):
    """Embed user info in the JWT response.

    When the authenticated user has TOTP two-factor enabled, the password
    check alone is not enough: a valid `otp` code must accompany the request.
    A missing code yields a `two_factor_required` error the frontend uses to
    prompt for the second factor; a wrong code yields an `otp` error.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["status"] = user.status
        token["email"] = user.email
        return token

    def validate(self, attrs):
        # super().validate authenticates the credentials and sets self.user.
        data = super().validate(attrs)
        user = self.user
        # Block login for accounts that have not confirmed their email address
        # yet. The frontend special-cases this error code to surface a "Renvoyer
        # le lien" action without prompting for the password again.
        if user.status == User.Status.PENDING_EMAIL:
            raise serializers.ValidationError(
                {
                    "detail": "Confirmez d'abord votre adresse email.",
                    "code": "email_not_verified",
                    "email": user.email,
                },
                code="email_not_verified",
            )
        if getattr(user, "two_factor_enabled", False) and user.totp_secret:
            import pyotp

            otp = str((self.initial_data or {}).get("otp", "")).strip()
            if not otp:
                raise serializers.ValidationError(
                    {"two_factor_required": ["otp_needed"]}, code="two_factor_required"
                )
            if not pyotp.TOTP(user.totp_secret).verify(otp, valid_window=1):
                raise serializers.ValidationError(
                    {"otp": ["Code de vérification invalide."]}, code="invalid_otp"
                )
        data["user"] = UserMiniSerializer(self.user).data
        return data


class ValidateExpertSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=[("approve", "approve"), ("reject", "reject")])
    note = serializers.CharField(required=False, allow_blank=True)
