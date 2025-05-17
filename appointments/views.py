# appointments/views.py corrigé complet

from django.contrib.auth import get_user_model, authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime

from .models import Appointment, Client, Employer, Service, Availability, Notification
from .serializers import (
    AppointmentSerializer,
    AppointmentReviewSerializer,
    ClientSerializer,
    EmployerSerializer,
    EmployerUpdateSerializer,
    ServiceSerializer,
    AvailabilitySerializer,
    NotificationSerializer,
    UserSerializer,
)

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def create_notification(user, notification_type, title, message, appointment=None):
    Notification.objects.create(
        recipient=user,
        notification_type=notification_type,
        title=title,
        message=message,
        appointment=appointment
    )


class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            role = serializer.validated_data.get('role')

            if role == 'client':
                Client.objects.create(user=user, name=user.first_name, email=user.email)
            elif role == 'employer':
                Employer.objects.create(user=user, name=user.first_name, email=user.email)

            tokens = get_tokens_for_user(user)
            return Response({
                'user': serializer.data,
                'refresh': tokens['refresh'],
                'access': tokens['access'],
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
            user = authenticate(username=user.username, password=password)
            if user:
                tokens = get_tokens_for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'refresh': tokens['refresh'],
                    'access': tokens['access'],
                })
            return Response({'error': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Déconnexion réussie'})
        except Exception:
            return Response({'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST)


class AppointmentList(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.all()


class CreateAppointment(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()

        if "date" in data and isinstance(data["date"], str):
            try:
                data["date"] = datetime.fromisoformat(data["date"].replace("Z", "+00:00"))
            except ValueError:
                return Response({"error": "Format de date invalide. Utilisez ISO 8601."},
                                status=status.HTTP_400_BAD_REQUEST)

        serializer = AppointmentSerializer(data=data)
        if serializer.is_valid():
            appointment = serializer.save(client=request.user.client)
            create_notification(
                user=appointment.employer.user,
                notification_type='appointment_request',
                title='Nouvelle demande de rendez-vous',
                message=f'Un nouveau rendez-vous a été demandé par {appointment.client.name}',
                appointment=appointment
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AppointmentDetail(RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if instance.status == 'accepté':
            create_notification(
                user=instance.client.user,
                notification_type='appointment_accepted',
                title='Rendez-vous accepté',
                message=f'Votre rendez-vous avec {instance.employer.name} a été accepté',
                appointment=instance
            )
        elif instance.status == 'refusé':
            create_notification(
                user=instance.client.user,
                notification_type='appointment_rejected',
                title='Rendez-vous refusé',
                message=f'Votre rendez-vous avec {instance.employer.name} a été refusé',
                appointment=instance
            )

        return Response(serializer.data)


class ClientList(generics.ListAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class ClientProfile(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientSerializer

    def get_object(self):
        return self.request.user.client


class EmployerList(ListAPIView):
    serializer_class = EmployerSerializer

    def get_queryset(self):
        queryset = Employer.objects.filter(is_active=True)
        service_id = self.request.query_params.get('service')
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        return queryset


class EmployerUpdate(generics.RetrieveUpdateAPIView):
    queryset = Employer.objects.all()
    serializer_class = EmployerUpdateSerializer


class EmployerProfile(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployerSerializer

    def get_object(self):
        return self.request.user.employer


class ServiceList(ListAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer


class ServiceDetail(RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class AddReview(generics.UpdateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentReviewSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        feedback = request.data.get("feedback")
        rating = request.data.get("rating")

        if feedback is None or rating is None:
            return Response({"error": "Feedback et évaluation obligatoires."},
                            status=status.HTTP_400_BAD_REQUEST)

        instance.feedback = feedback
        instance.rating = rating
        instance.save()
        return Response(self.get_serializer(instance).data)


class EmployerAvailability(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, employer_id):
        try:
            employer = Employer.objects.get(id=employer_id)
            availabilities = Availability.objects.filter(employer=employer)
            serializer = AvailabilitySerializer(availabilities, many=True)
            return Response(serializer.data)
        except Employer.DoesNotExist:
            return Response({"error": "Employeur non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, employer_id):
        try:
            employer = Employer.objects.get(id=employer_id)
            serializer = AvailabilitySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(employer=employer)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Employer.DoesNotExist:
            return Response({"error": "Employeur non trouvé"}, status=status.HTTP_404_NOT_FOUND)


class NotificationList(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')


class MarkNotificationRead(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Notification marquée comme lue"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification non trouvée"}, status=status.HTTP_404_NOT_FOUND)


class AppointmentReview(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            serializer = AppointmentReviewSerializer(appointment, data=request.data)
            if serializer.is_valid():
                serializer.save()
                create_notification(
                    user=appointment.employer.user,
                    notification_type='review_received',
                    title='Nouvel avis reçu',
                    message=f'Vous avez reçu un avis de {appointment.client.name}',
                    appointment=appointment
                )
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)


class ProcessPayment(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            payment_method = request.data.get('payment_method')

            if payment_method == 'carte':
                appointment.is_paid = True
                appointment.save()
                create_notification(
                    user=appointment.employer.user,
                    notification_type='payment_received',
                    title='Paiement reçu',
                    message=f'Paiement reçu pour le rendez-vous avec {appointment.client.name}',
                    appointment=appointment
                )
                return Response({"message": "Paiement traité avec succès"})
            else:
                return Response({"message": "Paiement en espèces à effectuer sur place"})
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)


class UserProfile(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class AppointmentPayment(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)

            if request.user != appointment.client.user:
                return Response({"error": "Non autorisé à effectuer ce paiement"}, status=status.HTTP_403_FORBIDDEN)

            payment_method = request.data.get('payment_method')

            if payment_method not in dict(Appointment.PAYMENT_CHOICES):
                return Response({"error": "Mode de paiement invalide"}, status=status.HTTP_400_BAD_REQUEST)

            appointment.payment_method = payment_method
            appointment.is_paid = True
            appointment.save()

            create_notification(
                user=appointment.employer.user,
                notification_type='payment_received',
                title='Paiement reçu',
                message=f'Paiement reçu pour le rendez-vous avec {appointment.client.name}',
                appointment=appointment
            )

            return Response({
                "message": "Paiement enregistré avec succès",
                "appointment": AppointmentSerializer(appointment).data
            })
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
