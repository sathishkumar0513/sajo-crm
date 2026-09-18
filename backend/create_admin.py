import os
import getpass
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

password = os.getenv("DJANGO_ADMIN_PASSWORD") or getpass.getpass("Administrator password: ")
if not password:
    raise SystemExit("An administrator password is required.")

admin_user, created = User.objects.get_or_create(
    username="admin",
    defaults={
        "email": "admin@sajo.com",
        "first_name": "Sajo",
        "last_name": "Admin",
        "is_staff": True,
        "is_superuser": True,
    }
)

if created:
    admin_user.set_password(password)
    admin_user.save()
    print("Superuser 'admin' created.")
else:
    admin_user.set_password(password)
    admin_user.save()
    print("Superuser 'admin' password updated.")
