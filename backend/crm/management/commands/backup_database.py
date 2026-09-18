from datetime import timedelta
from io import StringIO
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management import BaseCommand, CommandError, call_command
from django.utils import timezone

from crm.backup import encrypt_backup, upload_backup
from crm.models import DatabaseBackup


class Command(BaseCommand):
    help = "Create a database backup, apply retention cleanup, and optionally upload it."

    def add_arguments(self, parser):
        parser.add_argument(
            "--retention-days",
            type=int,
            default=None,
            help="Delete local backups older than this many days (default: configured setting).",
        )
        parser.add_argument(
            "--encrypt",
            action="store_true",
            help="Encrypt the backup using BACKUP_ENCRYPTION_KEY.",
        )
        parser.add_argument(
            "--no-upload",
            action="store_true",
            help="Do not invoke the configured off-site upload hook.",
        )
        parser.add_argument(
            "--require-upload",
            action="store_true",
            help="Fail unless an off-site upload hook is configured and succeeds.",
        )

    def handle(self, *args, **options):
        retention_days = (
            options["retention_days"]
            if options["retention_days"] is not None
            else settings.BACKUP_RETENTION_DAYS
        )
        if retention_days < 0:
            raise CommandError("--retention-days cannot be negative.")

        output = StringIO()
        call_command(
            "dumpdata",
            "--natural-foreign",
            "--natural-primary",
            "--exclude",
            "contenttypes",
            "--exclude",
            "auth.permission",
            stdout=output,
        )
        content = output.getvalue().encode("utf-8")
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        suffix = ".json.enc" if options["encrypt"] else ".json"
        filename = f"crm_backup_{timestamp}{suffix}"
        if options["encrypt"]:
            content = encrypt_backup(content)

        record = DatabaseBackup(name=filename, size=len(content))
        record.file.save(filename, ContentFile(content), save=False)
        record.save()

        cutoff = timezone.now() - timedelta(days=retention_days)
        removed = 0
        for old_record in DatabaseBackup.objects.filter(created_at__lt=cutoff).iterator():
            old_record.file.delete(save=False)
            old_record.delete()
            removed += 1

        if options["require_upload"] and not settings.BACKUP_UPLOAD_HOOK:
            record.file.delete(save=False)
            record.delete()
            raise CommandError("BACKUP_UPLOAD_HOOK must be configured when --require-upload is used.")
        if not options["no_upload"]:
            try:
                uploaded = upload_backup(Path(record.file.path), record)
            except Exception as exc:
                record.file.delete(save=False)
                record.delete()
                raise CommandError("Off-site backup upload failed.") from exc
            if uploaded is not True:
                record.file.delete(save=False)
                record.delete()
                raise CommandError("Off-site upload hook must return True after verifying upload success.")

        self.stdout.write(
            self.style.SUCCESS(
                f"Created backup {record.name} ({record.size} bytes); removed {removed} expired backup(s)."
            )
        )
