"""
Seed a baseline of Algerian heritage resources matching the frontend mock data.

Usage:
    python manage.py seed_heritage
"""
from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from apps.heritage.models import HeritageResource


SEED = [
    {
        "name_fr": "Casbah d'Alger",
        "name_ar": "قصبة الجزائر",
        "wilaya": "Alger",
        "commune": "Casbah",
        "period": HeritageResource.Period.OTTOMAN,
        "architectural_type": HeritageResource.ArchitecturalType.CASBAH,
        "classification_level": HeritageResource.ClassificationLevel.UNESCO,
        "geo_point": Point(3.0588, 36.7833, srid=4326),
        "description": "Médina ottomane classée patrimoine mondial UNESCO en 1992.",
    },
    {
        "name_fr": "Mosquée Ketchaoua",
        "name_ar": "جامع كتشاوة",
        "wilaya": "Alger",
        "commune": "Casbah",
        "period": HeritageResource.Period.OTTOMAN,
        "architectural_type": HeritageResource.ArchitecturalType.MOSQUE,
        "classification_level": HeritageResource.ClassificationLevel.NATIONAL,
        "geo_point": Point(3.0612, 36.7858, srid=4326),
        "description": "Mosquée emblématique fondée en 1612, restaurée par la Turquie en 2018.",
    },
    {
        "name_fr": "Mansourah",
        "name_ar": "المنصورة",
        "wilaya": "Tlemcen",
        "commune": "Mansourah",
        "period": HeritageResource.Period.MEDIEVAL,
        "architectural_type": HeritageResource.ArchitecturalType.FORTIFICATION,
        "classification_level": HeritageResource.ClassificationLevel.NATIONAL,
        "geo_point": Point(-1.3478, 34.8714, srid=4326),
        "description": "Cité mérinide du XIVe siècle.",
    },
    {
        "name_fr": "M'Zab — Ghardaïa",
        "name_ar": "وادي ميزاب",
        "wilaya": "Ghardaïa",
        "commune": "Ghardaïa",
        "period": HeritageResource.Period.MEDIEVAL,
        "architectural_type": HeritageResource.ArchitecturalType.CASBAH,
        "classification_level": HeritageResource.ClassificationLevel.UNESCO,
        "geo_point": Point(3.6730, 32.4906, srid=4326),
        "description": "Pentapole ibadite classée UNESCO en 1982.",
    },
    {
        "name_fr": "Timgad",
        "name_ar": "تيمقاد",
        "wilaya": "Batna",
        "commune": "Timgad",
        "period": HeritageResource.Period.ROMAN,
        "architectural_type": HeritageResource.ArchitecturalType.OTHER,
        "classification_level": HeritageResource.ClassificationLevel.UNESCO,
        "geo_point": Point(6.4683, 35.4842, srid=4326),
        "description": "Cité romaine fondée par Trajan en l'an 100, UNESCO 1982.",
    },
    {
        "name_fr": "Mosquée Sidi Boumediene — El-Eubbad",
        "name_ar": "ضريح سيدي بومدين",
        "wilaya": "Tlemcen",
        "commune": "El-Eubbad",
        "period": HeritageResource.Period.MEDIEVAL,
        "architectural_type": HeritageResource.ArchitecturalType.MOSQUE,
        "classification_level": HeritageResource.ClassificationLevel.NATIONAL,
        "geo_point": Point(-1.2917, 34.8767, srid=4326),
        "description": "Complexe religieux mérinide du XIVe siècle.",
    },
    {
        "name_fr": "Djémila (Cuicul)",
        "name_ar": "جميلة",
        "wilaya": "Sétif",
        "commune": "Djémila",
        "period": HeritageResource.Period.ROMAN,
        "architectural_type": HeritageResource.ArchitecturalType.OTHER,
        "classification_level": HeritageResource.ClassificationLevel.UNESCO,
        "geo_point": Point(5.7367, 36.3208, srid=4326),
        "description": "Ancienne ville romano-byzantine, UNESCO 1982.",
    },
    {
        "name_fr": "Tipaza",
        "name_ar": "تيبازة",
        "wilaya": "Tipaza",
        "commune": "Tipaza",
        "period": HeritageResource.Period.ROMAN,
        "architectural_type": HeritageResource.ArchitecturalType.OTHER,
        "classification_level": HeritageResource.ClassificationLevel.UNESCO,
        "geo_point": Point(2.4486, 36.5944, srid=4326),
        "description": "Ensemble archéologique punico-romain au bord de la mer, UNESCO 1982.",
    },
    {
        "name_fr": "Tassili n'Ajjer",
        "name_ar": "طاسيلي ناجر",
        "wilaya": "Illizi",
        "commune": "Djanet",
        "period": HeritageResource.Period.PREHISTORIC,
        "architectural_type": HeritageResource.ArchitecturalType.OTHER,
        "classification_level": HeritageResource.ClassificationLevel.UNESCO,
        "geo_point": Point(9.3000, 25.5000, srid=4326),
        "description": "Massif et art rupestre saharien, UNESCO 1982.",
    },
    {
        "name_fr": "Qalâa des Béni Hammad",
        "name_ar": "قلعة بني حماد",
        "wilaya": "M'Sila",
        "commune": "Maâdid",
        "period": HeritageResource.Period.MEDIEVAL,
        "architectural_type": HeritageResource.ArchitecturalType.FORTIFICATION,
        "classification_level": HeritageResource.ClassificationLevel.UNESCO,
        "geo_point": Point(4.7903, 35.8181, srid=4326),
        "description": "Première capitale hammadide (XIe siècle), UNESCO 1980.",
    },
]


class Command(BaseCommand):
    help = "Seed baseline Algerian heritage resources."

    def handle(self, *args, **options):
        created, updated = 0, 0
        for entry in SEED:
            obj, was_created = HeritageResource.objects.update_or_create(
                name_fr=entry["name_fr"],
                wilaya=entry["wilaya"],
                defaults=entry,
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f"Heritage seed done — created={created}, updated={updated}"
        ))
