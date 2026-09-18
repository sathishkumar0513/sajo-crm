from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("crm", "0007_staff_profile_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="assigned_to",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_leads", to="crm.staff"),
        ),
        migrations.AddField(
            model_name="lead",
            name="hotness",
            field=models.CharField(blank=True, choices=[("hot", "Hot Lead"), ("warm", "Warm Lead"), ("cold", "Cold Lead")], max_length=10),
        ),
    ]
