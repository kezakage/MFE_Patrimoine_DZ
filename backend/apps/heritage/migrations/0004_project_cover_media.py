# Generated for project cover media selection.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('heritage', '0003_heritage_disciplines_and_embedding'),
        ('media_app', '0003_add_model_3d_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='cover_media',
            field=models.ForeignKey(
                blank=True,
                help_text="Image chosen as the project's main photo.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='media_app.media',
            ),
        ),
    ]
