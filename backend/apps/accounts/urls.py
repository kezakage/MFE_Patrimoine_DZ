from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DisciplineViewSet,
    LoginView,
    MeViewSet,
    RefreshView,
    RegisterView,
    UserAdminViewSet,
)

router = DefaultRouter()
router.register("disciplines", DisciplineViewSet, basename="discipline")
router.register("admin/users", UserAdminViewSet, basename="admin-users")
router.register("register", RegisterView, basename="register")
router.register("me", MeViewSet, basename="me")

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("", include(router.urls)),
]
