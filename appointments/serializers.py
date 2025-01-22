from rest_framework import serializers
from .models import Appointment, Client, Employer, Service

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class EmployerSerializer(serializers.ModelSerializer):
    service = serializers.StringRelatedField()  # Affiche le nom du service

    class Meta:
        model = Employer
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    # Les relations client et employeur sont en lecture seule pour éviter les conflits lors de la création
    service = serializers.StringRelatedField()  # Affiche le nom du service
    client = ClientSerializer(read_only=True)
    employer = EmployerSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'

class EmployerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employer
        fields = ['name', 'email', 'phone', 'service', 'availability']  # Champs modifiables par l'employeur

class AppointmentReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'feedback', 'rating']  # Champs nécessaires pour ajouter une évaluation
