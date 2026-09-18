from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0006_enquiry_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="staff",
            name="profile_image",
            field=models.ImageField(blank=True, null=True, upload_to="staff/"),
        ),
    ]
