# Email verification (level-2 sign-up flow) — adds PENDING_EMAIL status and
# the timestamp fields used by the email confirmation workflow.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_two_factor'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending_email', 'Email non confirmé'),
                    ('pending', 'Pending validation'),
                    ('active', 'Active'),
                    ('rejected', 'Rejected'),
                ],
                default='pending',
                max_length=13,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='email_verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='last_verification_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
