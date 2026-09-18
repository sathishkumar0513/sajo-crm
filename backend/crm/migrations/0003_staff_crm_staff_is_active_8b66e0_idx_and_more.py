from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("crm", "0002_customer_crm_custome_email_4aa51e_idx_and_more")]

    operations = [
        migrations.CreateModel(
            name="Staff",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("designation", models.CharField(blank=True, max_length=120)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ("name",)},
        ),
        migrations.AddIndex(
            model_name="staff",
            index=models.Index(fields=["is_active"], name="crm_staff_i_is_acti_7a7f85_idx"),
        ),
        migrations.AddIndex(
            model_name="staff",
            index=models.Index(fields=["designation"], name="crm_staff_d_design_7509fa_idx"),
        ),
    ]
