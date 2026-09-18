from pathlib import Path

from django.conf import settings
from django.utils.module_loading import import_string


def encrypt_backup(content):
    """Encrypt backup bytes with Fernet when the optional dependency is enabled."""
    try:
        from cryptography.fernet import Fernet
    except ImportError as exc:
        raise RuntimeError(
            "Encrypted backups require the 'cryptography' package."
        ) from exc
    key = getattr(settings, "BACKUP_ENCRYPTION_KEY", "")
    if not key:
        raise RuntimeError("BACKUP_ENCRYPTION_KEY must be configured for encrypted backups.")
    return Fernet(key.encode("ascii")).encrypt(content)


def decrypt_backup(content):
    try:
        from cryptography.fernet import Fernet
    except ImportError as exc:
        raise RuntimeError(
            "Encrypted backups require the 'cryptography' package."
        ) from exc
    key = getattr(settings, "BACKUP_ENCRYPTION_KEY", "")
    if not key:
        raise RuntimeError("BACKUP_ENCRYPTION_KEY must be configured for encrypted backups.")
    return Fernet(key.encode("ascii")).decrypt(content)


def upload_backup(path, record):
    """Call the deployment-provided off-site hook, if one is configured."""
    hook_path = getattr(settings, "BACKUP_UPLOAD_HOOK", "")
    if not hook_path:
        return None
    hook = import_string(hook_path)
    return hook(Path(path), record)
