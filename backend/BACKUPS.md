# Database backups

Create a local JSON backup and remove backups older than the configured retention
period:

```text
python manage.py backup_database
python manage.py backup_database --retention-days 14
```

Encryption is opt-in. Set `BACKUP_ENCRYPTION_KEY` to a Fernet key kept outside
the repository, then use `backup_database --encrypt`. For scheduled backups, use
`backup_database --encrypt --require-upload`. The same key is required
to restore an encrypted file:

```text
python manage.py restore_database --backup-id 12 --confirm-restore
python manage.py restore_database --file private_backups/crm_backup_....json --confirm-restore
```

Restore never runs without `--confirm-restore`. It loads the fixture into the
configured Django database; take a current backup first and test restores in a
safe environment.

Deployments may set `BACKUP_UPLOAD_HOOK` to a dotted Python callable. The
callable receives `(backup_path, database_backup_record)` after a successful
local backup. The hook is disabled by default and should use the deployment's
secret-managed SDK or credentials. The hook must return `True` only after
verifying that the encrypted object was stored successfully. Pass `--no-upload`
to skip it for a run.

## Windows automatic scheduling

The repository includes a Windows Task Scheduler runner configured for daily
execution at 02:00 local server time:

```powershell
Set-Location .\backend
powershell -ExecutionPolicy Bypass -File .\scripts\register_backup_task.ps1
```

The task runs `backup_database --encrypt --require-upload`, applies retention cleanup, and calls
the configured off-site upload hook. Configure `BACKUP_ENCRYPTION_KEY` and
`BACKUP_UPLOAD_HOOK` in the deployment environment before registering the task.
The service account must have access to the project, virtual environment,
database, private backup directory, and any off-site storage credentials.

Remove the task with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\unregister_backup_task.ps1
```
