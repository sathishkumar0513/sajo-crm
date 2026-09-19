import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update the production administrator from environment variables."

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_ADMIN_USERNAME")
        email = os.getenv("DJANGO_ADMIN_EMAIL")
        password = os.getenv("DJANGO_ADMIN_PASSWORD")

        missing = [
            name
            for name, value in (
                ("DJANGO_ADMIN_USERNAME", username),
                ("DJANGO_ADMIN_EMAIL", email),
                ("DJANGO_ADMIN_PASSWORD", password),
            )
            if not value
        ]
        if missing:
            raise CommandError(
                "Missing required environment variable(s): " + ", ".join(missing)
            )

        User = get_user_model()
        admin_user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        admin_user.email = email
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.set_password(password)
        admin_user.save(
            update_fields=(
                "email",
                "password",
                "is_staff",
                "is_superuser",
                "is_active",
            )
        )

        action = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Administrator {action}."))
