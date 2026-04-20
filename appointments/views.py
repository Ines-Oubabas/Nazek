# appointments/views.py
from datetime import datetime
import random

from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import DateTimeField
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.text import slugify

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Appointment, Client, Employer, Service, Availability, Notification
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
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


# -----------------------------
# Utils
# -----------------------------
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def create_notification(user, notification_type, title, message, appointment=None):
    Notification.objects.create(
        recipient=user,
        notification_type=notification_type,
        title=title,
        message=message,
        appointment=appointment,
    )


def generate_unique_username(email=None, first_name="", last_name=""):
    base = ""
    if email:
        base = email.split("@")[0]
    if not base:
        base = f"{first_name}.{last_name}".strip(".")
    base = slugify(base) or "user"

    candidate = base
    i = 0
    while User.objects.filter(username=candidate).exists():
        i += 1
        candidate = f"{base}{i}"
        if i > 9999:
            candidate = f"{base}{random.randint(10000, 99999)}"
            break
    return candidate


def truthy(v):
    if isinstance(v, bool):
        return v
    if v is None:
        return False
    return str(v).strip().lower() in {"1", "true", "yes", "y", "on", "oui"}


def resolve_service(service_value):
    """
    service_value peut être:
    - un ID (ex: "3")
    - un nom (ex: "Plomberie")
    """
    if isinstance(service_value, Service):
        return service_value

    if service_value is None:
        return None

    if isinstance(service_value, int) or (isinstance(service_value, str) and service_value.strip().isdigit()):
        try:
            return Service.objects.get(pk=int(service_value))
        except Service.DoesNotExist:
            return None

    if isinstance(service_value, str):
        name = service_value.strip()
        if not name:
            return None
        try:
            return Service.objects.get(name__iexact=name)
        except Service.DoesNotExist:
            return None

    return None


# -----------------------------
# Appointment payload helpers
# -----------------------------
def normalize_appointment_payload(data):
    """
    Tolérant au frontend :
    - serviceId -> service
    - employerId -> employer
    - notes -> description (car ton model a "description", pas "notes")
    - date="YYYY-MM-DD" + time="HH:MM" -> date datetime (DateTimeField)
    - supprime "time" ensuite (champ inexistant dans model Appointment)
    """
    if "service" not in data and "serviceId" in data:
        data["service"] = data.pop("serviceId")

    if "employer" not in data and "employerId" in data:
        data["employer"] = data.pop("employerId")

    if "description" not in data and "notes" in data:
        data["description"] = data.pop("notes")

    # Empêcher le client de forcer des champs sensibles
    for k in ["client", "status", "is_paid", "payment_method", "feedback", "rating"]:
        data.pop(k, None)

    # Convertir date/time si Appointment.date est DateTimeField
    try:
        date_field = Appointment._meta.get_field("date")
        is_datetime = isinstance(date_field, DateTimeField)
    except Exception:
        is_datetime = True

    if is_datetime and isinstance(data.get("date"), str):
        date_str = data.get("date")

        # si date = "YYYY-MM-DD" et time fourni
        if "T" not in date_str and data.get("time"):
            date_str = f"{date_str}T{data.get('time')}:00"

        dt = parse_datetime(date_str)

        if dt is None:
            try:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except ValueError:
                dt = None

        if dt is not None:
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            data["date"] = dt

    # champ inexistant dans model
    data.pop("time", None)

    return data


def auto_pick_employer_if_missing(data):
    """
    Si employer absent, essaye de prendre le premier employeur actif lié au service.
    (Mais Appointment.employer est obligatoire => si introuvable, on renverra 400)
    """
    if data.get("employer"):
        return data

    service_value = data.get("service")
    if not service_value:
        return data

    service_obj = resolve_service(service_value)
    if not service_obj:
        return data

    # Normalise le payload pour le serializer ModelSerializer attendu (PK)
    data["service"] = service_obj.id

    employer = Employer.objects.filter(service=service_obj, is_active=True).first()
    if employer:
        data["employer"] = employer.id

    return data


def user_appointments_queryset(user):
    qs = Appointment.objects.all().order_by("-date")

    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return qs

    if hasattr(user, "client"):
        return qs.filter(client=user.client)

    if hasattr(user, "employer"):
        return qs.filter(employer=user.employer)

    return qs.none()


# -----------------------------
# 🔐 AUTH
# -----------------------------
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Compatible avec ton frontend Register.jsx :
        - first_name / last_name
        - email / password
        - phone / address
        - is_employer (bool)
        - service_type (id ou nom)
        - service_description
        """
        raw = request.data.copy()

        # Mapping camelCase -> snake_case (au cas où)
        if "first_name" not in raw and "firstName" in raw:
            raw["first_name"] = raw.get("firstName")
        if "last_name" not in raw and "lastName" in raw:
            raw["last_name"] = raw.get("lastName")

        email = raw.get("email")
        password = raw.get("password")

        if not email:
            return Response({"email": ["Email requis."]}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"password": ["Mot de passe requis."]}, status=status.HTTP_400_BAD_REQUEST)

        # Rôle: basé sur role OU is_employer
        role = raw.get("role")
        if not role:
            is_employer = raw.get("is_employer") or raw.get("isEmployer") or raw.get("is_provider") or raw.get("isProvider")
            role = "employer" if truthy(is_employer) else "client"

        role_map = {
            "prestataire": "employer",
            "provider": "employer",
            "employeur": "employer",
            "client": "client",
            "customer": "client",
            "user": "client",
        }
        role = role_map.get(str(role).strip().lower(), str(role).strip().lower())
        if role not in {"client", "employer"}:
            role = "client"

        # Username auto
        username = raw.get("username") or generate_unique_username(
            email=email,
            first_name=raw.get("first_name", "") or "",
            last_name=raw.get("last_name", "") or "",
        )

        # Champs profil
        phone = raw.get("phone") or raw.get("telephone") or ""
        address = raw.get("address") or raw.get("adresse") or ""

        # Champs employer venant du frontend
        service_value = raw.get("service") or raw.get("serviceId") or raw.get("service_id") or raw.get("service_type")
        service_description = raw.get("service_description") or raw.get("description") or raw.get("bio") or ""

        # Construire user_data strict (évite unknown fields)
        user_data = {
            "username": username,
            "email": email,
            "first_name": raw.get("first_name", "") or "",
            "last_name": raw.get("last_name", "") or "",
            "role": role,
            "phone": phone,
            "address": address,
            "password": password,
        }

        serializer = UserSerializer(data=user_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = serializer.save()

                full_name = f"{user.first_name} {user.last_name}".strip()
                display_name = full_name or user.username

                if role == "client":
                    Client.objects.create(
                        user=user,
                        name=display_name,
                        email=user.email,
                        phone=phone or "",
                        address=address or None,
                    )
                else:
                    service_obj = resolve_service(service_value)
                    if service_value and not service_obj:
                        return Response({"service_type": ["Service introuvable."]}, status=status.HTTP_400_BAD_REQUEST)

                    Employer.objects.create(
                        user=user,
                        name=display_name,
                        email=user.email,
                        phone=phone or "",
                        service=service_obj,
                        description=service_description or None,
                    )

            tokens = get_tokens_for_user(user)
            return Response(
                {"user": UserSerializer(user).data, "refresh": tokens["refresh"], "access": tokens["access"]},
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"error": "Email et mot de passe requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
            if user:
                tokens = get_tokens_for_user(user)
                return Response(
                    {"user": UserSerializer(user).data, "refresh": tokens["refresh"], "access": tokens["access"]}
                )
            return Response({"error": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé"}, status=status.HTTP_404_NOT_FOUND)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            try:
                token.blacklist()
            except Exception:
                pass
            return Response({"message": "Déconnexion réussie"})
        except Exception:
            return Response({"error": "Token invalide"}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# 📅 APPOINTMENTS
# -----------------------------
class AppointmentList(ListAPIView):
    """
    GET /appointments/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        return user_appointments_queryset(self.request.user)


class CreateAppointment(APIView):
    """
    POST /appointments/create/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, "client"):
            return Response({"error": "Seuls les clients peuvent créer un rendez-vous."}, status=status.HTTP_403_FORBIDDEN)

        try:
            data = normalize_appointment_payload(request.data.copy())
            data = auto_pick_employer_if_missing(data)

            if not data.get("employer"):
                return Response({"employer": ["Ce champ est obligatoire."]}, status=status.HTTP_400_BAD_REQUEST)

            serializer = AppointmentCreateSerializer(data=data)
            if serializer.is_valid():
                appointment = serializer.save(client=request.user.client)

                create_notification(
                    user=appointment.employer.user,
                    notification_type="appointment_request",
                    title="Nouvelle demande de rendez-vous",
                    message=f"Un nouveau rendez-vous a été demandé par {appointment.client.name}",
                    appointment=appointment,
                )

                return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except AttributeError:
            return Response({"error": "Le client associé à cet utilisateur est introuvable."}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AppointmentDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        return user_appointments_queryset(self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if hasattr(request.user, "client") and "status" in request.data:
            return Response({"error": "Le client ne peut pas modifier le statut."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        instance.refresh_from_db()

        if instance.status == "accepté":
            create_notification(
                user=instance.client.user,
                notification_type="appointment_accepted",
                title="Rendez-vous accepté",
                message=f"Votre rendez-vous avec {instance.employer.name} a été accepté",
                appointment=instance,
            )
        elif instance.status == "refusé":
            create_notification(
                user=instance.client.user,
                notification_type="appointment_rejected",
                title="Rendez-vous refusé",
                message=f"Votre rendez-vous avec {instance.employer.name} a été refusé",
                appointment=instance,
            )

        return Response(serializer.data)


class AppointmentReview(APIView):
    """
    POST /appointments/<pk>/review/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = user_appointments_queryset(request.user).get(id=pk)
            serializer = AppointmentReviewSerializer(appointment, data=request.data)
            if serializer.is_valid():
                serializer.save()
                create_notification(
                    user=appointment.employer.user,
                    notification_type="review_received",
                    title="Nouvel avis reçu",
                    message=f"Vous avez reçu un nouvel avis de {appointment.client.name}",
                    appointment=appointment,
                )
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)


class AddReview(generics.UpdateAPIView):
    """
    POST/PUT /appointments/<pk>/add-review/
    """
    serializer_class = AppointmentReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return user_appointments_queryset(self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        feedback = request.data.get("feedback")
        rating = request.data.get("rating")

        if feedback is None or rating is None:
            return Response({"error": "Les champs 'feedback' et 'rating' sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

        instance.feedback = feedback
        instance.rating = rating
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AppointmentPayment(APIView):
    """
    POST /appointments/<pk>/payment/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = user_appointments_queryset(request.user).get(pk=pk)

            if not hasattr(request.user, "client") or request.user != appointment.client.user:
                return Response({"error": "Vous n'êtes pas autorisé à effectuer ce paiement"}, status=status.HTTP_403_FORBIDDEN)

            payment_method = request.data.get("payment_method")
            if payment_method not in dict(Appointment.PAYMENT_CHOICES):
                return Response({"error": "Mode de paiement invalide"}, status=status.HTTP_400_BAD_REQUEST)

            appointment.payment_method = payment_method
            appointment.is_paid = True
            appointment.save()

            create_notification(
                user=appointment.employer.user,
                notification_type="payment_received",
                title="Paiement reçu",
                message=f"Le paiement pour le rendez-vous avec {appointment.client.name} a été reçu",
                appointment=appointment,
            )

            return Response({"message": "Paiement enregistré avec succès", "appointment": AppointmentSerializer(appointment).data})
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProcessPayment(APIView):
    """
    POST /payments/<appointment_id>/process/
    (compat: accepte aussi appointment_id dans le body)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, appointment_id=None):
        try:
            resolved_appointment_id = (
                appointment_id
                or request.data.get("appointment_id")
                or request.data.get("appointment")
            )
            if not resolved_appointment_id:
                return Response({"error": "appointment_id requis."}, status=status.HTTP_400_BAD_REQUEST)

            appointment = user_appointments_queryset(request.user).get(id=resolved_appointment_id)

            payment_method = request.data.get("payment_method")
            if payment_method == "carte":
                appointment.is_paid = True
                appointment.save()

                create_notification(
                    user=appointment.employer.user,
                    notification_type="payment_received",
                    title="Paiement reçu",
                    message=f"Le paiement pour le rendez-vous avec {appointment.client.name} a été reçu",
                    appointment=appointment,
                )
                return Response({"message": "Paiement traité avec succès"})

            return Response({"message": "Paiement en espèces à effectuer sur place"})
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)


# -----------------------------
# 👤 CLIENT / 👷 EMPLOYER
# -----------------------------
class ClientProfile(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientSerializer

    def get_object(self):
        if not hasattr(self.request.user, "client"):
            raise PermissionDenied("Profil client introuvable.")
        return self.request.user.client


class EmployerList(ListAPIView):
    permission_classes = [AllowAny]
    queryset = Employer.objects.filter(is_active=True)
    serializer_class = EmployerSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        service_id = self.request.query_params.get("service", None)
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        return queryset


class EmployerUpdate(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployerUpdateSerializer

    def get_object(self):
        if not hasattr(self.request.user, "employer"):
            raise PermissionDenied("Profil employeur introuvable.")
        return self.request.user.employer


class EmployerProfile(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployerSerializer

    def get_object(self):
        if not hasattr(self.request.user, "employer"):
            raise PermissionDenied("Profil employeur introuvable.")
        return self.request.user.employer


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
        if not hasattr(request.user, "employer") or request.user.employer.id != employer_id:
            return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        try:
            employer = Employer.objects.get(id=employer_id)
            serializer = AvailabilitySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(employer=employer)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Employer.DoesNotExist:
            return Response({"error": "Employeur non trouvé"}, status=status.HTTP_404_NOT_FOUND)


# -----------------------------
# 🛠️ SERVICES
# -----------------------------
class ServiceList(ListAPIView):
    permission_classes = [AllowAny]
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer


class ServiceDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [AllowAny]
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


# -----------------------------
# 🔔 NOTIFICATIONS
# -----------------------------
class NotificationList(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")


class MarkNotificationRead(APIView):
    """
    POST /notifications/<pk>/read/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Notification marquée comme lue"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification non trouvée"}, status=status.HTTP_404_NOT_FOUND)


# -----------------------------
# 👤 USER PROFILE
# -----------------------------
class UserProfile(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user