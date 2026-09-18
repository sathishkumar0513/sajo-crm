from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0005_calendarevent_contact_gstinvoice_payment_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="enquiry",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_enquiries",
                to="crm.staff",
            ),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="contacted_person",
            field=models.CharField(blank=True, max_length=160),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="conversion_percentage",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="date_of_visit",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="enquiry_type",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="phone",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="quote_value",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="referred_by",
            field=models.CharField(blank=True, max_length=160),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="site_location",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="enquiry",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
