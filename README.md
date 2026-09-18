# Sajo CCTV CRM

React/Vite frontend and Django REST Framework backend for the CRM/ERP application:

- `backend/`: Django REST Framework API with MySQL configuration, cookie-based JWT authentication, private media, and backup commands.
- `frontend/`: React/Vite application with CRM modules and IIS SPA fallback.

## Backend setup

1. Create a Python virtual environment.
2. Install dependencies:

   ```powershell
   cd backend
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and set development-only values. Never commit `.env` or place database credentials in React or source control.
4. Create a MySQL database, then set the database and security values in `.env`. Do not copy
   credentials from a local development environment into source control. Then run:

   ```powershell
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py collectstatic --noinput
   python manage.py runserver
   ```

Authentication endpoints:

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `POST /api/auth/logout/`

Authentication uses HttpOnly access and refresh cookies with CSRF protection. Configure the API
origin with `VITE_API_URL` for development when the backend is not at
`http://localhost:8000/api`. For a separate production frontend/API deployment, copy
`frontend/.env.example` to `frontend/.env` before building and set `VITE_API_URL` to the API
base URL including `/api`. Leave it empty when the frontend is served from the same origin as
the API.

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

## Windows production outline

1. Install backend requirements, including Waitress, and configure production values from `backend/.env.example`.
2. Run `python manage.py migrate` and `python manage.py collectstatic --noinput`.
3. Run `backend/scripts/start_waitress.ps1` behind IIS.
4. Build the frontend with `npm run build` and publish `frontend/dist` as the IIS site root.
5. Configure IIS reverse proxy/API routing and HTTPS. Do not expose Django's development server publicly.
6. Configure encrypted off-site backups before registering `backend/scripts/register_backup_task.ps1`.

See [backend/BACKUPS.md](backend/BACKUPS.md) for backup, restore, retention, upload-hook, and scheduler procedures.

## Provider-neutral deployment checklist

1. Supply a unique production `SECRET_KEY`; never reuse a local key.
2. Set `DEBUG=False`, production `ALLOWED_HOSTS`, `DB_*`, `CORS_ALLOWED_ORIGINS`,
   and `CSRF_TRUSTED_ORIGINS` in the hosting provider's environment configuration.
3. Use `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`, and
   `SECURE_SSL_REDIRECT=True` only when HTTPS is active at the public application boundary.
4. Run `python manage.py migrate` and `python manage.py collectstatic --noinput`.
5. Persist `backend/media/` and `backend/private_backups/`; these directories must not be
   ephemeral if uploaded files or backups need to survive restarts.
6. Build the frontend after setting `VITE_API_URL`:

   ```powershell
   cd frontend
   npm run build
   ```

7. Serve `frontend/dist` with the host's static web server and run Django through a production
   WSGI server such as Waitress. Do not expose `runserver`.

The current local `backend/.env` contains credentials and must remain untracked. Those
credentials should be rotated before any public deployment or repository upload.
