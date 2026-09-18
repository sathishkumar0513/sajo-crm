from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.middleware.csrf import CsrfViewMiddleware


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        if request.path in {
            "/api/auth/login/",
            "/api/auth/refresh/",
            "/api/auth/csrf/",
            "/api/auth/logout/",
        }:
            return None
        raw_token = request.COOKIES.get("access_token")
        used_cookie = bool(raw_token)
        if not raw_token:
            header = self.get_header(request)
            if header:
                raw_token = self.get_raw_token(header)
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        if used_cookie and request.method not in ("GET", "HEAD", "OPTIONS"):
            reason = CsrfViewMiddleware(lambda request: None).process_view(request, lambda request: None, (), {})
            if reason:
                raise AuthenticationFailed("CSRF validation failed.")
        return self.get_user(validated_token), validated_token
