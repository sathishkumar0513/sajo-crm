from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="Lead",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("status", models.CharField(choices=[("new", "New Lead"), ("contact_attempted", "Contact Attempted"), ("contacted", "Contacted"), ("enquiry_created", "Enquiry Created"), ("unreachable", "Unreachable"), ("customer", "Customer")], default="new", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="Enquiry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("status", models.CharField(choices=[("new", "New Enquiry"), ("contacted", "Contacted"), ("visit_scheduled", "Visit Scheduled"), ("postpone", "Postpone"), ("drop", "Drop"), ("visited", "Visited"), ("quoted", "Quoted"), ("follow_up", "Follow Up"), ("won", "Won"), ("lost", "Lost")], default="new", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("customer", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="enquiries", to="crm.customer")),
            ],
            options={"ordering": ("-created_at",)},
        ),
    ]
