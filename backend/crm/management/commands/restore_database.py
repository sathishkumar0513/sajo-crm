from pathlib import Path

from django.core.management import BaseCommand, CommandError, call_command

from crm.backup import decrypt_backup
from crm.models import DatabaseBackup


class Command(BaseCommand):
    help = "Restore a database backup (requires the explicit --confirm-restore flag)."

    def add_arguments(self, parser):
        source = parser.add_mutually_exclusive_group(required=True)
        source.add_argument("--file", help="Path to a local backup file.")
        source.add_argument("--backup-id", type=int, help="DatabaseBackup record ID.")
        parser.add_argument(
            "--confirm-restore",
            action="store_true",
            help="Required safety acknowledgement for this destructive operation.",
        )

    def handle(self, *args, **options):
        if not options["confirm_restore"]:
            raise CommandError("Restore is destructive; pass --confirm-restore to continue.")

        if options["backup_id"] is not None:
            try:
                record = DatabaseBackup.objects.get(pk=options["backup_id"])
            except DatabaseBackup.DoesNotExist as exc:
                raise CommandError("Backup record was not found.") from exc
            if not record.file:
                raise CommandError("Backup record has no file.")
            path = Path(record.file.path)
        else:
            path = Path(options["file"]).resolve()

        if not path.is_file():
            raise CommandError("Backup file was not found.")
        content = path.read_bytes()
        if path.name.endswith(".enc"):
            content = decrypt_backup(content)

        fixture_path = path.with_suffix(path.suffix + ".restore.json")
        try:
            fixture_path.write_bytes(content)
            call_command("loaddata", str(fixture_path), verbosity=1)
        finally:
            fixture_path.unlink(missing_ok=True)
        self.stdout.write(self.style.SUCCESS(f"Restored backup from {path.name}."))
