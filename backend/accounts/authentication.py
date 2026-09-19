import logging

from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.middleware.csrf import CsrfViewMiddleware


logger = logging.getLogger(__name__)


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        logger.info(
            "AUTH DIAGNOSTIC: authenticate_called=True class=%s access_token_cookie=%s",
            self.__class__.__name__,
            bool(request.COOKIES.get("access_token")),
        )
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
            logger.info(
                "AUTH DIAGNOSTIC: class=%s authenticated_user_id=none",
                self.__class__.__name__,
            )
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
            if used_cookie and request.method not in ("GET", "HEAD", "OPTIONS"):
                reason = CsrfViewMiddleware(lambda request: None).process_view(request, lambda request: None, (), {})
                if reason:
                    raise AuthenticationFailed("CSRF validation failed.")
            user = self.get_user(validated_token)
        except AuthenticationFailed as exc:
            logger.info(
                "AUTH DIAGNOSTIC: class=%s authentication_exception_type=%s "
                "authentication_exception_message=%s authenticated_user_id=none",
                self.__class__.__name__,
                type(exc).__name__,
                str(exc),
            )
            raise
        logger.info(
            "AUTH DIAGNOSTIC: class=%s authenticated_user_id=%s",
            self.__class__.__name__,
            user.pk,
        )
        return user, validated_token
