import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.views import APIView

from .serializers import UserSerializer


logger = logging.getLogger(__name__)


class MeView(APIView):
    permission_classes = ()

    def get(self, request):
        authentication_classes = [
            authenticator.__class__.__name__
            for authenticator in self.get_authenticators()
        ]
        if not request.user.is_authenticated:
            return Response(
                {
                    "diagnostic": True,
                    "authentication_classes": authentication_classes,
                    "default_authentication_classes": [
                        authenticator.__name__
                        for authenticator in api_settings.DEFAULT_AUTHENTICATION_CLASSES
                    ],
                    "has_access_token_cookie": bool(request.COOKIES.get("access_token")),
                    "request_user_authenticated": False,
                    "request_user_id": None,
                },
                status=401,
            )
        logger.info(
            "AUTH DIAGNOSTIC: MeView.get authentication_classes=%s "
            "authenticated_user_id=%s",
            authentication_classes,
            request.user.pk,
        )
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.save() and UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        return Response({"success": True, "message": "Logout acknowledged."})
