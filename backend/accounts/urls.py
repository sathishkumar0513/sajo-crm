from django.urls import path

from .views import LogoutView, MeView

urlpatterns = [
    path("me/", MeView.as_view(), name="auth-me"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
]
