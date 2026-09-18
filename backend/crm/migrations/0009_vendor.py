from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("crm", "0008_lead_assignment_hotness"),
    ]

    operations = [
        migrations.CreateModel(
            name="Vendor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("company", models.CharField(max_length=160)),
                ("gst_number", models.CharField(blank=True, max_length=40)),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("product", models.CharField(blank=True, max_length=160)),
                ("address", models.TextField(blank=True)),
                ("country", models.CharField(default="India", max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("zip_code", models.CharField(blank=True, max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ("company",),
                "indexes": [
                    models.Index(fields=["company"], name="crm_vendor_company_f6f8d1_idx"),
                    models.Index(fields=["gst_number"], name="crm_vendor_gst_num_033527_idx"),
                    models.Index(fields=["is_active"], name="crm_vendor_is_acti_343bd6_idx"),
                ],
            },
        ),
    ]
