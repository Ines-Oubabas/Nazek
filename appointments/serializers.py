from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from .models import Appointment, Availability, Client, Employer, Notification, Service

User = get_user_model()


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "description", "icon", "is_active"]


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ["id", "day_of_week", "start_time", "end_time", "is_available"]

    def validate(self, attrs):
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({"end_time": "L'heure de fin doit être après l'heure de début."})
        return attrs


class EmployerSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source="service",
        write_only=True,
        required=False,
        allow_null=True,
    )
    city = serializers.SerializerMethodField()

    class Meta:
        model = Employer
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "service",
            "service_id",
            "is_active",
            "created_at",
            "profile_picture",
            "description",
            "average_rating",
            "total_reviews",
            "is_verified",
            "hourly_rate",
            "city",
        ]
        read_only_fields = ["created_at", "average_rating", "total_reviews", "is_verified"]

    def get_city(self, obj):
        return (obj.user.address or "").strip()


class EmployerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employer
        fields = ["name", "phone", "description", "hourly_rate", "profile_picture", "service"]


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "name", "email", "phone", "created_at", "profile_picture", "address"]
        read_only_fields = ["created_at"]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "address",
            "profile_picture",
            "password",
        ]

    def validate_email(self, value):
        value = (value or "").strip().lower()
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Cette adresse email existe déjà.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AppointmentSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    employer = EmployerSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "client",
            "employer",
            "service",
            "date",
            "status",
            "description",
            "payment_method",
            "total_amount",
            "is_paid",
            "feedback",
            "rating",
            "created_at",
            "estimated_duration",
            "location",
        ]
        read_only_fields = ["created_at", "is_paid"]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.filter(is_active=True))
    employer = serializers.PrimaryKeyRelatedField(queryset=Employer.objects.filter(is_active=True))

    class Meta:
        model = Appointment
        fields = [
            "id",
            "service",
            "employer",
            "date",
            "description",
            "payment_method",
            "estimated_duration",
            "location",
        ]

    def validate_date(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("La date du rendez-vous doit être dans le futur.")
        return value

    def validate(self, attrs):
        employer = attrs.get("employer")
        service = attrs.get("service")
        date_value = attrs.get("date")

        if employer and service and employer.service_id and employer.service_id != service.id:
            raise serializers.ValidationError(
                {"service": "Le service sélectionné ne correspond pas au prestataire choisi."}
            )

        if employer and employer.employer_appointments.filter(date=date_value).exists():
            raise serializers.ValidationError({"date": "Le prestataire n'est pas disponible à cette date."})

        return attrs


class AppointmentReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["id", "feedback", "rating"]

    def validate_rating(self, value):
        if value is None:
            raise serializers.ValidationError("La note est obligatoire.")
        if value < 1 or value > 5:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value

    def update(self, instance, validated_data):
        instance.feedback = validated_data.get("feedback", instance.feedback)
        instance.rating = validated_data.get("rating", instance.rating)
        instance.status = "terminé"
        instance.save()

        if instance.rating and hasattr(instance.employer, "update_rating"):
            instance.employer.update_rating(instance.rating)

        return instance


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "message", "is_read", "created_at", "appointment"]
        read_only_fields = ["created_at"]