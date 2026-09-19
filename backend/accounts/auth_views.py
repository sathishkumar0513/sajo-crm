import logging

from django.conf import settings
from django.middleware.csrf import get_token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import EmailTokenObtainPairSerializer


logger = logging.getLogger(__name__)


COOKIE_KWARGS = {
    "httponly": True,
    "secure": settings.SESSION_COOKIE_SECURE,
    "samesite": "None" if settings.SESSION_COOKIE_SECURE else "Lax",
    "path": "/",
}


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        logger.info("LOGIN VIEW DIAGNOSTIC: LoginView.post reached")
        serializer = EmailTokenObtainPairSerializer(data=request.data, context={"request": request})
        logger.info("LOGIN VIEW DIAGNOSTIC: validating EmailTokenObtainPairSerializer")
        serializer.is_valid(raise_exception=True)
        response = Response({"authenticated": True})
        response.set_cookie("access_token", serializer.validated_data["access"], max_age=900, **COOKIE_KWARGS)
        response.set_cookie("refresh_token", serializer.validated_data["refresh"], max_age=86400, **COOKIE_KWARGS)
        response.set_cookie("csrftoken", get_token(request), secure=settings.CSRF_COOKIE_SECURE, samesite="Lax", path="/")
        return response


class RefreshCookieView(TokenRefreshView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data={"refresh": request.COOKIES.get("refresh_token", "")})
        serializer.is_valid(raise_exception=True)
        response = Response({"authenticated": True})
        response.set_cookie("access_token", serializer.validated_data["access"], max_age=900, **COOKIE_KWARGS)
        return response


class CsrfView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        response = Response({"csrfToken": get_token(request)})
        response.set_cookie(
            "csrftoken",
            response.data["csrfToken"],
            secure=settings.CSRF_COOKIE_SECURE,
            samesite="Lax",
            path="/",
        )
        return response


class CookieLogoutView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        response = Response({"success": True})
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        return response
