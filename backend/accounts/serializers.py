from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    staff_id = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    date_joined = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    is_administrator = serializers.SerializerMethodField()
    profile_image_upload = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = get_user_model()
        fields = ("id", "staff_id", "username", "email", "first_name", "last_name", "is_staff", "is_administrator", "phone", "gender", "designation", "date_joined", "profile_image", "profile_image_upload")

    def get_is_administrator(self, obj):
        staff = self.get_staff(obj)
        return bool(obj.is_superuser or (staff and staff.is_administrator and staff.is_active))

    def get_staff(self, obj):
        staff = getattr(obj, "staff_profile", None)
        if staff:
            return staff
        from crm.models import Staff
        return Staff.objects.filter(email__iexact=obj.email).first()

    def get_staff_id(self, obj):
        staff = self.get_staff(obj)
        return staff.id if staff else None

    def get_phone(self, obj):
        staff = self.get_staff(obj)
        return staff.phone if staff else ""

    def get_gender(self, obj):
        staff = self.get_staff(obj)
        return staff.gender if staff else ""

    def get_designation(self, obj):
        staff = self.get_staff(obj)
        return staff.designation if staff else ""

    def get_date_joined(self, obj):
        staff = self.get_staff(obj)
        return staff.date_joined if staff else None

    def get_profile_image(self, obj):
        staff = self.get_staff(obj)
        if not staff or not staff.profile_image or not staff.profile_image.storage.exists(staff.profile_image.name):
            return None
        request = self.context.get("request")
        media_path = f"/api/media/{staff.profile_image.name}"
        return request.build_absolute_uri(media_path) if request else media_path

    def update(self, instance, validated_data):
        profile_image = validated_data.pop("profile_image_upload", None)
        request_data = self.context["request"].data
        instance.first_name = request_data.get("first_name", instance.first_name)
        instance.last_name = request_data.get("last_name", instance.last_name)
        email = request_data.get("email", instance.email).strip().lower()
        if get_user_model().objects.filter(email__iexact=email).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError({"email": "A user already exists with this email."})
        instance.email = email
        instance.username = email
        password = request_data.get("password")
        if password:
            instance.set_password(password)
        instance.save()
        staff = self.get_staff(instance)
        if staff:
            staff.email = email
            staff.first_name = instance.first_name
            staff.last_name = instance.last_name
            staff.name = " ".join(part for part in (instance.first_name, instance.last_name) if part).strip() or staff.name
            staff.save(update_fields=("email", "first_name", "last_name", "name", "updated_at") if hasattr(staff, "updated_at") else ("email", "first_name", "last_name", "name"))
            if not staff.user_id:
                staff.user = instance
                staff.save(update_fields=("user",))
            if profile_image is not None:
                staff.profile_image = profile_image
                staff.save(update_fields=("profile_image",))
        return instance


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
    email = attrs.get("email", "").strip().lower()
    password = attrs.get("password", "")

    print("LOGIN DEBUG - email:", email)
    print("LOGIN DEBUG - password received:", bool(password))

    user = get_user_model().objects.filter(email__iexact=email).first()

    print("LOGIN DEBUG - user:", user)
    print("LOGIN DEBUG - username:", user.username if user else None)

    if not user:
        raise AuthenticationFailed(
            self.error_messages["no_active_account"],
            "no_active_account"
        )

    self.user = authenticate(
        request=self.context.get("request"),
        username=user.username,
        password=password,
    )

    print("LOGIN DEBUG - authenticate result:", self.user)

    if not self.user or not self.user.is_active:
        raise AuthenticationFailed(
            self.error_messages["no_active_account"],
            "no_active_account"
        )

    refresh = self.get_token(self.user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }