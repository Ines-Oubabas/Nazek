from django.utils import timezone
from rest_framework import serializers

from .models import Appointment, Availability, Client, Employer, Notification, Service, User


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = "__all__"

    def validate(self, attrs):
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "L'heure de fin doit être après l'heure de début."}
            )
        return attrs


class ClientSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Client
        fields = "__all__"


class EmployerSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    service = ServiceSerializer(read_only=True)
    availabilities = AvailabilitySerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    total_reviews = serializers.IntegerField(read_only=True)

    class Meta:
        model = Employer
        fields = "__all__"


class EmployerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employer
        fields = [
            "name",
            "email",
            "phone",
            "service",
            "description",
            "hourly_rate",
            "profile_picture",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    employer = EmployerSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)

    class Meta:
        model = Appointment
        fields = "__all__"


class AppointmentCreateSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(read_only=True)
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.filter(is_active=True))
    employer = serializers.PrimaryKeyRelatedField(queryset=Employer.objects.filter(is_active=True))

    class Meta:
        model = Appointment
        fields = "__all__"

    def validate(self, attrs):
        dt = attrs.get("date")
        if dt is None:
            raise serializers.ValidationError({"date": "La date est obligatoire."})

        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())
            attrs["date"] = dt

        if dt <= timezone.now():
            raise serializers.ValidationError({"date": "La date du rendez-vous doit être dans le futur."})

        employer = attrs.get("employer")
        service = attrs.get("service")

        # Tolérance UX: si le front envoie un service qui ne correspond pas
        # à l'employeur choisi, on aligne automatiquement sur le service réel
        # de l'employeur pour éviter une boucle d'erreurs 400 côté UI.
        if employer and employer.service_id:
            if service is None or employer.service_id != service.id:
                attrs["service"] = employer.service

        if employer and hasattr(employer, "is_available") and not employer.is_available(dt):
            raise serializers.ValidationError(
                {"date": "L'employeur n'est pas disponible à cette date."}
            )

        return attrs


class AppointmentReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["id", "feedback", "rating"]

    def validate_rating(self, value):
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


class UserSerializer(serializers.ModelSerializer):
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
        extra_kwargs = {"password": {"write_only": True}}

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