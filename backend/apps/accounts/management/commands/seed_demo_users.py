"""
Create demo users (admin/expert/researcher) matching the frontend mock auth.

Usage:
    python manage.py seed_demo_users
"""
from django.core.management.base import BaseCommand

from apps.accounts.models import Discipline, User


DEMO = [
    {
        "email": "admin@patrimoine.dz",
        "password": "Admin12345!",
        "first_name": "Admin",
        "last_name": "Plateforme",
        "role": User.Role.ADMIN,
        "status": User.Status.ACTIVE,
        "is_staff": True,
        "is_superuser": True,
        "disciplines": [],
    },
    {
        "email": "expert@patrimoine.dz",
        "password": "Expert12345!",
        "first_name": "Yacine",
        "last_name": "Belkacem",
        "role": User.Role.EXPERT,
        "status": User.Status.ACTIVE,
        "disciplines": ["Architecture", "Histoire"],
    },
    {
        "email": "chercheur@patrimoine.dz",
        "password": "Chercheur12345!",
        "first_name": "Amina",
        "last_name": "Hadjadj",
        "role": User.Role.RESEARCHER,
        "status": User.Status.ACTIVE,
        "disciplines": ["Archéologie"],
    },
]


class Command(BaseCommand):
    help = "Seed demo users (admin/expert/chercheur)."

    def handle(self, *args, **options):
        for entry in DEMO:
            disc_names = entry.pop("disciplines", [])
            password = entry.pop("password")
            user, created = User.objects.update_or_create(
                email=entry["email"], defaults=entry,
            )
            user.set_password(password)
            user.save()
            for name in disc_names:
                d = Discipline.objects.filter(name_fr=name).first()
                if d:
                    user.disciplines.add(d)
            self.stdout.write(self.style.SUCCESS(
                f"{'Created' if created else 'Updated'} {user.email} ({user.role})"
            ))
