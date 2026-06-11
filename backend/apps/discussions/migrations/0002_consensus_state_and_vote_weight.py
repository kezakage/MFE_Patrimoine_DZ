"""
Adds the weighted-consensus fields:
- `Discussion.consensus_state` + `consensus_auto_resolved`
- `ConflictVote.weight`
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("discussions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="discussion",
            name="consensus_state",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                    ("tie", "Tie"),
                ],
                default="pending",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="discussion",
            name="consensus_auto_resolved",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="conflictvote",
            name="weight",
            field=models.PositiveSmallIntegerField(default=1),
        ),
    ]
