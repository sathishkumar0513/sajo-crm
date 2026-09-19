from django.contrib import admin
from django.conf import settings
from django.http import FileResponse, Http404
from pathlib import Path
from django.urls import include, path, re_path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from accounts.auth_views import CookieLogoutView, CsrfView, LoginView, RefreshCookieView

from .frontend import frontend_asset, frontend_index


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def protected_media(request, path):
    media_root = Path(settings.MEDIA_ROOT).resolve()
    requested_path = (media_root / path).resolve()
    if media_root not in requested_path.parents or not requested_path.is_file():
        raise Http404
    return FileResponse(requested_path.open("rb"))


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", LoginView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", RefreshCookieView.as_view(), name="token_refresh"),
    path("api/auth/csrf/", CsrfView.as_view(), name="csrf-token"),
    path("api/auth/logout/", CookieLogoutView.as_view(), name="cookie-logout"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("crm.urls")),
    path("api/media/<path:path>", protected_media, name="protected-media"),
    path("media/<path:path>", protected_media, name="protected-media-alias"),
    re_path(r"^assets/(?P<path>.+)$", frontend_asset, name="frontend-asset"),
    re_path(r"^(?P<path>.*)$", frontend_index, name="frontend-index"),
]
