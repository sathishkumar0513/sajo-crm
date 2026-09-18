from rest_framework.permissions import BasePermission


class IsAdministrator(BasePermission):
    message = "Administrator access is required for this operation."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        staff = getattr(request.user, "staff_profile", None)
        return bool(staff and staff.is_administrator and staff.is_active)
