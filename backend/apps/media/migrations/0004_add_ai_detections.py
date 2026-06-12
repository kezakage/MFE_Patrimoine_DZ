# Generated for YOLOv8 object detection support (complement of CLIP tagging).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('media_app', '0003_add_model_3d_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='media',
            name='ai_detections',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
