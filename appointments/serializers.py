from rest_framework import serializers
from .models import Appointment, Client, Employer, Service
from django.utils import timezone


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = "__all__"


class EmployerSerializer(serializers.ModelSerializer):
    service = serializers.StringRelatedField()

    class Meta:
        model = Employer
        fields = "__all__"


class EmployerUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour mettre à jour les informations d'un employeur.
    """

    class Meta:
        model = Employer
        fields = ["name", "email", "phone", "service"]  # Inclut les champs modifiables


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    employer = serializers.PrimaryKeyRelatedField(queryset=Employer.objects.all())
    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Appointment
        fields = "__all__"

    def validate_date(self, value):
        """Validation pour éviter les rendez-vous dans le passé."""
        if value <= timezone.now():
            raise serializers.ValidationError("La date du rendez-vous doit être dans le futur.")
        return value


class AppointmentReviewSerializer(serializers.ModelSerializer):
    """
    Serializer pour ajouter un feedback et une évaluation à un rendez-vous.
    """

    class Meta:
        model = Appointment
        fields = ["id", "feedback", "rating"]

    def validate_rating(self, value):
        """Validation de la note pour éviter les valeurs incorrectes."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value
