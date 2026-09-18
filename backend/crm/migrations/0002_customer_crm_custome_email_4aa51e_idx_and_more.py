from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("crm", "0001_initial")]

    operations = [
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["email"], name="crm_custome_email_4aa51e_idx"),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["phone"], name="crm_custome_phone_eb81ab_idx"),
        ),
        migrations.AddIndex(
            model_name="enquiry",
            index=models.Index(fields=["status"], name="crm_enquiry_status_2fcbe8_idx"),
        ),
        migrations.AddIndex(
            model_name="enquiry",
            index=models.Index(fields=["created_at"], name="crm_enquiry_created_c25455_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["status"], name="crm_lead_status_2c1bc7_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["created_at"], name="crm_lead_created_d9bbc3_idx"),
        ),
    ]
