import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404


FRONTEND_ROOT = (settings.BASE_DIR.parent / "frontend" / "dist").resolve()


def _frontend_file(relative_path):
    requested_path = (FRONTEND_ROOT / relative_path).resolve()
    if requested_path != FRONTEND_ROOT and FRONTEND_ROOT not in requested_path.parents:
        raise Http404
    if not requested_path.is_file():
        raise Http404
    return requested_path


def frontend_asset(request, path):
    asset_path = _frontend_file(Path("assets") / path)
    content_type, _ = mimetypes.guess_type(asset_path.name)
    return FileResponse(asset_path.open("rb"), content_type=content_type)


def frontend_index(request, path=""):
    if request.method not in ("GET", "HEAD"):
        raise Http404
    index_path = _frontend_file("index.html")
    return FileResponse(index_path.open("rb"), content_type="text/html")
