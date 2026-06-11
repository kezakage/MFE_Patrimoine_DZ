from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django_filters import rest_framework as filters

from .models import HeritageResource, Project


class HeritageResourceFilter(filters.FilterSet):
    near = filters.CharFilter(method="filter_near")
    radius_km = filters.NumberFilter(method="filter_noop")
    # Multi-valued discipline filter (?disciplines=1&disciplines=2 → OR).
    # Names match the M2M field so django-filter resolves it transparently.
    disciplines = filters.BaseInFilter(field_name="disciplines__id")

    class Meta:
        model = HeritageResource
        fields = (
            "period", "architectural_type", "classification_level", "wilaya",
            "disciplines",
        )

    def filter_noop(self, qs, name, value):
        return qs

    def filter_near(self, qs, name, value: str):
        """`near=lng,lat` + optional radius_km (default 50)."""
        try:
            lng, lat = (float(x) for x in value.split(","))
        except (ValueError, TypeError):
            return qs
        radius = float(self.data.get("radius_km", 50))
        point = Point(lng, lat, srid=4326)
        return (
            qs.exclude(geo_point__isnull=True)
              .filter(geo_point__distance_lte=(point, D(km=radius)))
              .annotate(distance=Distance("geo_point", point))
              .order_by("distance")
        )


class ProjectFilter(filters.FilterSet):
    period = filters.CharFilter(field_name="resource__period")
    architectural_type = filters.CharFilter(field_name="resource__architectural_type")
    wilaya = filters.CharFilter(field_name="resource__wilaya")
    mine = filters.BooleanFilter(method="filter_mine")

    class Meta:
        model = Project
        fields = ("status", "period", "architectural_type", "wilaya", "mine")

    def filter_mine(self, qs, name, value):
        """When `mine=true`, restrict to projects the current user is a member of."""
        user = getattr(self.request, "user", None)
        if not value or user is None or not user.is_authenticated:
            return qs
        return qs.filter(memberships__user=user)
