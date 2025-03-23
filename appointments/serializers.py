from rest_framework import serializers
from .models import Appointment, Client, Employer, Service, Availability, Notification, User
from django.utils import timezone


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = "__all__"


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
        fields = ["name", "email", "phone", "service"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    employer = EmployerSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Appointment
        fields = "__all__"

    def validate_date(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("La date du rendez-vous doit être dans le futur.")
        return value

    def validate(self, data):
        employer = self.initial_data.get('employer')
        date = self.initial_data.get('date')

        if employer and date:
            try:
                employer_instance = Employer.objects.get(id=employer)
                parsed_date = timezone.datetime.fromisoformat(date.replace("Z", "+00:00"))
                if not employer_instance.is_available(parsed_date):
                    raise serializers.ValidationError("L'employeur n'est pas disponible à cette date.")
            except Employer.DoesNotExist:
                raise serializers.ValidationError("L'employeur spécifié n'existe pas.")
        return data


class AppointmentReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["id", "feedback", "rating"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value

    def update(self, instance, validated_data):
        instance.feedback = validated_data.get('feedback', instance.feedback)
        instance.rating = validated_data.get('rating', instance.rating)
        instance.status = 'terminé'
        instance.save()

        if instance.rating:
            instance.employer.update_rating(instance.rating)

        return instance


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'address', 'profile_picture', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user
