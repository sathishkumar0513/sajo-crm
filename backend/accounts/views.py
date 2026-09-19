import logging

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer


logger = logging.getLogger(__name__)


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        logger.info(
            "AUTH DIAGNOSTIC: MeView.get authentication_classes=%s "
            "authenticated_user_id=%s",
            [authentication_class.__name__ for authentication_class in self.authentication_classes],
            request.user.pk if request.user.is_authenticated else "none",
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
