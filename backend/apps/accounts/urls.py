from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .social_views import GitHubLoginView, GoogleLoginView, SocialProvidersStatusView
from .views import (
    AdminStatsView,
    DisciplineViewSet,
    LoginView,
    MeViewSet,
    RefreshView,
    RegisterView,
    ResendVerificationView,
    TwoFactorDisableView,
    TwoFactorEnableView,
    TwoFactorSetupView,
    UserAdminViewSet,
    VerifyEmailView,
)

router = DefaultRouter()
router.register("disciplines", DisciplineViewSet, basename="discipline")
router.register("admin/users", UserAdminViewSet, basename="admin-users")
router.register("register", RegisterView, basename="register")
router.register("me", MeViewSet, basename="me")

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),

    # Email confirmation (level-2 sign-up flow)
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),

    # Two-factor authentication (TOTP)
    path("2fa/setup/", TwoFactorSetupView.as_view(), name="2fa-setup"),
    path("2fa/enable/", TwoFactorEnableView.as_view(), name="2fa-enable"),
    path("2fa/disable/", TwoFactorDisableView.as_view(), name="2fa-disable"),

    # OAuth2 / SSO
    path("social/providers/", SocialProvidersStatusView.as_view(), name="social-providers"),
    path("social/google/", GoogleLoginView.as_view(), name="social-google"),
    path("social/github/", GitHubLoginView.as_view(), name="social-github"),

    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("", include(router.urls)),
]
