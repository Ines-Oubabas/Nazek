from datetime import datetime
import random

from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.db.models import DateTimeField, Q
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
    if isinstance(service_value, Service):
        return service_value
    if service_value is None:
        return None

    if isinstance(service_value, int) or (isinstance(service_value, str) and service_value.strip().isdigit()):
        try:
            return Service.objects.get(pk=int(service_value), is_active=True)
        except Service.DoesNotExist:
            return None

    if isinstance(service_value, str):
        name = service_value.strip()
        if not name:
            return None
        try:
            return Service.objects.get(name__iexact=name, is_active=True)
        except Service.DoesNotExist:
            return None

    return None


def normalize_appointment_payload(data):
    if "service" not in data and "serviceId" in data:
        data["service"] = data.pop("serviceId")
    if "employer" not in data and "employerId" in data:
        data["employer"] = data.pop("employerId")
    if "description" not in data and "notes" in data:
        data["description"] = data.pop("notes")

    for k in ["client", "status", "is_paid", "feedback", "rating", "created_at"]:
        data.pop(k, None)

    try:
        date_field = Appointment._meta.get_field("date")
        is_datetime = isinstance(date_field, DateTimeField)
    except Exception:
        is_datetime = True

    if is_datetime and isinstance(data.get("date"), str):
        date_str = data.get("date")
        if "T" not in date_str and data.get("time"):
            date_str = f"{date_str}T{data.get('time')}:00"

        dt = parse_datetime(date_str)
        if dt is None:
            try:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except ValueError:
                dt = None

        if dt is not None and timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())

        if dt is not None:
            data["date"] = dt

    data.pop("time", None)
    return data


def auto_pick_employer_if_missing(data):
    if data.get("employer"):
        return data

    service_obj = resolve_service(data.get("service"))
    if not service_obj:
        return data

    data["service"] = service_obj.id
    employer = Employer.objects.filter(service=service_obj, is_active=True).first()
    if employer:
        data["employer"] = employer.id
    return data


def user_appointments_queryset(user):
    qs = Appointment.objects.select_related("client", "employer", "service").all().order_by("-date")
    if user.is_staff or user.is_superuser:
        return qs
    if hasattr(user, "client"):
        return qs.filter(client=user.client)
    if hasattr(user, "employer"):
        return qs.filter(employer=user.employer)
    return qs.none()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        raw = request.data.copy()
        email = (raw.get("email") or "").strip().lower()
        password = raw.get("password")

        if not email:
            return Response({"email": ["Email requis."]}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"password": ["Mot de passe requis."]}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"email": ["Cette adresse email existe déjà."]}, status=status.HTTP_400_BAD_REQUEST)

        role = raw.get("role")
        if not role:
            role = "employer" if truthy(raw.get("is_employer")) else "client"
        role = str(role).strip().lower()
        if role not in {"client", "employer"}:
            role = "client"

        first_name = (raw.get("first_name") or "").strip()
        last_name = (raw.get("last_name") or "").strip()
        username = generate_unique_username(email=email, first_name=first_name, last_name=last_name)

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=(raw.get("phone") or "").strip(),
            address=(raw.get("address") or "").strip(),
        )
        user.set_password(password)
        user.save()

        full_name = f"{first_name} {last_name}".strip() or username

        if role == "employer":
            service_obj = resolve_service(raw.get("service_type") or raw.get("service"))
            Employer.objects.create(
                user=user,
                name=full_name,
                email=email,
                phone=(raw.get("phone") or "").strip(),
                service=service_obj,
                description=(raw.get("service_description") or "").strip(),
            )
        else:
            Client.objects.create(
                user=user,
                name=full_name,
                email=email,
                phone=(raw.get("phone") or "").strip(),
                address=(raw.get("address") or "").strip(),
            )

        return Response(
            {"user": UserSerializer(user).data, "tokens": get_tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        login_value = (request.data.get("email") or request.data.get("username") or "").strip()
        password = request.data.get("password", "")

        if not login_value or not password:
            return Response({"detail": "Email/username et mot de passe requis."}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        if "@" in login_value:
            user_obj = User.objects.filter(email__iexact=login_value).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)
        else:
            user = authenticate(request, username=login_value, password=password)

        if not user:
            return Response({"detail": "Mot de passe incorrect ou compte introuvable."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(
            {"user": UserSerializer(user).data, "tokens": get_tokens_for_user(user)},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"refresh": ["Token refresh requis."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
        except Exception:
            return Response({"detail": "Refresh token invalide."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Déconnexion réussie."}, status=status.HTTP_200_OK)


class UserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @transaction.atomic
    def delete(self, request):
        # suppression complète utilisateur + données liées (CASCADE)
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServiceList(generics.ListCreateAPIView):
    queryset = Service.objects.filter(is_active=True).order_by("name")
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]


class ServiceDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]


class EmployerList(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmployerSerializer

    def get_queryset(self):
        qs = Employer.objects.select_related("service", "user").filter(is_active=True)

        q = (self.request.query_params.get("q") or "").strip()
        location = (self.request.query_params.get("location") or "").strip()

        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(description__icontains=q)
                | Q(service__name__icontains=q)
            )

        if location:
            qs = qs.filter(
                Q(user__address__icontains=location)
                | Q(description__icontains=location)
            )

        return qs.order_by("-is_verified", "-average_rating", "name")


class EmployerProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "employer"):
            raise PermissionDenied("Profil prestataire introuvable.")
        return Response(EmployerSerializer(request.user.employer).data)


class EmployerUpdate(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        if not hasattr(request.user, "employer"):
            raise PermissionDenied("Profil prestataire introuvable.")
        serializer = EmployerUpdateSerializer(request.user.employer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmployerSerializer(request.user.employer).data)


class EmployerAvailability(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, employer_id):
        employer = Employer.objects.filter(pk=employer_id, is_active=True).first()
        if not employer:
            return Response({"detail": "Prestataire introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AvailabilitySerializer(employer.availabilities.all(), many=True)
        return Response(serializer.data)


class ClientProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client introuvable.")
        return Response(ClientSerializer(request.user.client).data)

    def put(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client introuvable.")
        serializer = ClientSerializer(request.user.client, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AppointmentList(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        return user_appointments_queryset(self.request.user)


class CreateAppointment(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Seul un compte client peut prendre un rendez-vous.")

        data = normalize_appointment_payload(request.data.copy())
        data = auto_pick_employer_if_missing(data)

        serializer = AppointmentCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        appointment = serializer.save(client=request.user.client)

        create_notification(
            appointment.employer.user,
            "new_appointment",
            "Nouveau rendez-vous",
            f"Vous avez un rendez-vous le {appointment.date}.",
            appointment,
        )
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)


class AppointmentDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        return user_appointments_queryset(self.request.user)

    def perform_destroy(self, instance):
        # client et prestataire peuvent annuler/supprimer leur rdv visible
        instance.delete()


class AppointmentReview(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = user_appointments_queryset(request.user).filter(pk=pk).first()
        if not appointment:
            return Response({"detail": "Rendez-vous introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if not hasattr(request.user, "client") or appointment.client != request.user.client:
            raise PermissionDenied("Seul le client concerné peut laisser un avis.")

        serializer = AppointmentReviewSerializer(appointment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AppointmentSerializer(appointment).data)


class AddReview(AppointmentReview):
    def put(self, request, pk):
        return self.post(request, pk)


class AppointmentPayment(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = user_appointments_queryset(request.user).filter(pk=pk).first()
        if not appointment:
            return Response({"detail": "Rendez-vous introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if not hasattr(request.user, "client") or appointment.client != request.user.client:
            raise PermissionDenied("Seul le client peut payer.")

        payment_method = request.data.get("payment_method", appointment.payment_method)
        if payment_method not in {"carte", "especes"}:
            return Response({"payment_method": ["Mode de paiement invalide."]}, status=status.HTTP_400_BAD_REQUEST)

        appointment.payment_method = payment_method
        appointment.is_paid = True
        appointment.save(update_fields=["payment_method", "is_paid"])
        return Response(AppointmentSerializer(appointment).data)


class NotificationList(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")


class MarkNotificationRead(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        notif = Notification.objects.filter(id=notification_id, recipient=request.user).first()
        if not notif:
            return Response({"detail": "Notification introuvable."}, status=status.HTTP_404_NOT_FOUND)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"message": "Notification lue."})


class ProcessPayment(AppointmentPayment):
    def post(self, request, appointment_id):
        return super().post(request, appointment_id)