# appointments/views.py
from datetime import datetime
import random

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.db.models import DateTimeField, Q, Count
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

from .models import (
    Appointment,
    Availability,
    Client,
    ContactRequest,
    Conversation,
    Employer,
    FavoriteEmployer,
    FavoriteService,
    Message,
    Notification,
    Review,
    Service,
)
from .serializers import (
    AppointmentCancelSerializer,
    AppointmentCreateSerializer,
    AppointmentReviewLegacySerializer,
    AppointmentSerializer,
    AvailabilitySerializer,
    ClientProfileUpsertSerializer,
    ClientSerializer,
    ContactRequestSerializer,
    ConversationCreateSerializer,
    ConversationSerializer,
    EmployerProfileUpsertSerializer,
    EmployerSerializer,
    FavoriteEmployerSerializer,
    FavoriteServiceSerializer,
    MessageCreateSerializer,
    MessageSerializer,
    MyProfilesSerializer,
    NotificationSerializer,
    RegisterSerializer,
    ReviewSerializer,
    ServiceSerializer,
    UserSerializer,
)

User = get_user_model()


# ----------------------------
# Helpers
# ----------------------------

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

    for k in ["client", "status", "is_paid", "feedback", "rating", "created_at", "updated_at"]:
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


def can_access_appointment(user, appointment: Appointment):
    if user.is_staff or user.is_superuser:
        return True
    if hasattr(user, "client") and appointment.client_id == user.client.id:
        return True
    if hasattr(user, "employer") and appointment.employer_id == user.employer.id:
        return True
    return False


def build_profiles_payload(user):
    return MyProfilesSerializer(
        {
            "user": user,
            "client": getattr(user, "client", None),
            "employer": getattr(user, "employer", None),
        }
    ).data


def first_non_empty(data, keys):
    for key in keys:
        value = data.get(key, None)
        if value is not None and str(value).strip() != "":
            return value
    return None


# ----------------------------
# Auth
# ----------------------------

class RegisterView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        payload = request.data.copy()

        if "create_client_profile" not in payload and "create_employer_profile" not in payload:
            role = payload.get("role")
            if role:
                role = str(role).strip().lower()
            else:
                role = "employer" if truthy(payload.get("is_employer")) else "client"

            payload["create_client_profile"] = role == "client"
            payload["create_employer_profile"] = role == "employer"

            if payload.get("service_type") and not payload.get("employer_service_id"):
                srv = resolve_service(payload.get("service_type"))
                if srv:
                    payload["employer_service_id"] = srv.id

            if payload.get("service_description") and not payload.get("employer_description"):
                payload["employer_description"] = payload.get("service_description")

        serializer = RegisterSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "user": UserSerializer(user).data,
                "profiles": build_profiles_payload(user),
                "tokens": get_tokens_for_user(user),
            },
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
            {
                "user": UserSerializer(user).data,
                "profiles": build_profiles_payload(user),
                "tokens": get_tokens_for_user(user),
            },
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


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data

        old_password = first_non_empty(data, ["old_password", "current_password", "currentPassword", "password"])
        new_password = first_non_empty(data, ["new_password", "newPassword"])
        new_password_confirm = first_non_empty(
            data,
            ["new_password_confirm", "confirm_password", "confirmPassword", "newPasswordConfirm"],
        )

        if not old_password:
            return Response({"old_password": ["Ancien mot de passe requis."]}, status=status.HTTP_400_BAD_REQUEST)

        if not new_password:
            return Response({"new_password": ["Nouveau mot de passe requis."]}, status=status.HTTP_400_BAD_REQUEST)

        sent_confirmation = any(
            key in data for key in ["new_password_confirm", "confirm_password", "confirmPassword", "newPasswordConfirm"]
        )
        if sent_confirmation and new_password_confirm != new_password:
            return Response(
                {"new_password_confirm": ["La confirmation du mot de passe ne correspond pas."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        if not user.check_password(old_password):
            return Response({"old_password": ["Ancien mot de passe incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except Exception as exc:
            errors = list(exc.messages) if hasattr(exc, "messages") else ["Mot de passe invalide."]
            return Response({"new_password": errors}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"message": "Mot de passe mis à jour avec succès."}, status=status.HTTP_200_OK)


# ----------------------------
# User profile
# ----------------------------

class UserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @transaction.atomic
    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyProfilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_profiles_payload(request.user))


# ----------------------------
# Services + Search
# ----------------------------

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
        service = (self.request.query_params.get("service") or "").strip()

        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(description__icontains=q)
                | Q(service__name__icontains=q)
            )

        if location:
            qs = qs.filter(
                Q(city__icontains=location)
                | Q(address__icontains=location)
                | Q(user__address__icontains=location)
                | Q(description__icontains=location)
            )

        if service:
            if service.isdigit():
                qs = qs.filter(service_id=int(service))
            else:
                qs = qs.filter(service__name__icontains=service)

        return qs.order_by("-is_verified", "-average_rating", "name")


class SearchView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmployerSerializer

    def get_queryset(self):
        qs = Employer.objects.select_related("service", "user").filter(is_active=True)

        q = (self.request.query_params.get("q") or "").strip()
        location = (self.request.query_params.get("location") or "").strip()
        service = (self.request.query_params.get("service") or "").strip()

        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(description__icontains=q)
                | Q(service__name__icontains=q)
            )

        if location:
            qs = qs.filter(
                Q(city__icontains=location)
                | Q(address__icontains=location)
                | Q(user__address__icontains=location)
            )

        if service:
            if service.isdigit():
                qs = qs.filter(service_id=int(service))
            else:
                qs = qs.filter(service__name__icontains=service)

        return qs.order_by("-is_verified", "-average_rating", "name")


# ----------------------------
# Client / Employer profile
# ----------------------------

class EmployerProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "employer"):
            raise PermissionDenied("Profil prestataire introuvable.")
        return Response(EmployerSerializer(request.user.employer).data)


class EmployerUpdate(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = EmployerProfileUpsertSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        employer = serializer.save()
        return Response(EmployerSerializer(employer).data)

    def patch(self, request):
        serializer = EmployerProfileUpsertSerializer(data=request.data, context={"request": request}, partial=True)
        serializer.is_valid(raise_exception=True)
        employer = serializer.save()
        return Response(EmployerSerializer(employer).data)


class EmployerAvailability(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, employer_id):
        employer = Employer.objects.filter(pk=employer_id, is_active=True).first()
        if not employer:
            return Response({"detail": "Prestataire introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AvailabilitySerializer(employer.availabilities.all(), many=True)
        return Response(serializer.data)

    def post(self, request, employer_id):
        employer = Employer.objects.filter(pk=employer_id, is_active=True).first()
        if not employer:
            return Response({"detail": "Prestataire introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_staff or (hasattr(request.user, "employer") and request.user.employer.id == employer.id)):
            raise PermissionDenied("Non autorisé.")

        incoming = request.data
        items = incoming if isinstance(incoming, list) else incoming.get("availabilities", [])
        if not isinstance(items, list):
            return Response({"detail": "Format invalide."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        errors = []

        for idx, item in enumerate(items):
            ser = AvailabilitySerializer(data=item)
            if ser.is_valid():
                obj = Availability.objects.create(employer=employer, **ser.validated_data)
                created.append(obj)
            else:
                errors.append({"index": idx, "errors": ser.errors})

        if errors:
            return Response(
                {"detail": "Certaines disponibilités sont invalides.", "errors": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(AvailabilitySerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class ClientProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client introuvable.")
        return Response(ClientSerializer(request.user.client).data)

    def put(self, request):
        serializer = ClientProfileUpsertSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return Response(ClientSerializer(client).data)

    def patch(self, request):
        serializer = ClientProfileUpsertSerializer(data=request.data, context={"request": request}, partial=True)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return Response(ClientSerializer(client).data)


class CreateClientProfile(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, "client"):
            return Response({"detail": "Profil client déjà existant."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ClientProfileUpsertSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return Response(ClientSerializer(client).data, status=status.HTTP_201_CREATED)


class CreateEmployerProfile(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, "employer"):
            return Response({"detail": "Profil prestataire déjà existant."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = EmployerProfileUpsertSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        employer = serializer.save()
        return Response(EmployerSerializer(employer).data, status=status.HTTP_201_CREATED)


# ----------------------------
# Appointments
# ----------------------------

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
        actor = "systeme"
        if hasattr(self.request.user, "client") and instance.client_id == self.request.user.client.id:
            actor = "client"
        elif hasattr(self.request.user, "employer") and instance.employer_id == self.request.user.employer.id:
            actor = "prestataire"
        instance.cancel(by=actor, reason="Annulation via endpoint DELETE")


class AppointmentCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = Appointment.objects.select_related("client", "employer").filter(pk=pk).first()
        if not appointment:
            return Response({"detail": "Rendez-vous introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if not can_access_appointment(request.user, appointment):
            raise PermissionDenied("Non autorisé.")

        if appointment.status == Appointment.Status.CANCELED:
            return Response(AppointmentSerializer(appointment).data)

        if hasattr(request.user, "client") and appointment.client_id == request.user.client.id:
            by = "client"
        elif hasattr(request.user, "employer") and appointment.employer_id == request.user.employer.id:
            by = "prestataire"
        else:
            by = "systeme"

        serializer = AppointmentCancelSerializer(
            data=request.data,
            context={"appointment": appointment, "canceled_by": by},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if by == "client":
            create_notification(
                appointment.employer.user,
                "appointment_canceled",
                "Rendez-vous annulé",
                f"Le client a annulé le rendez-vous du {appointment.date}.",
                appointment,
            )
        elif by == "prestataire":
            create_notification(
                appointment.client.user,
                "appointment_canceled",
                "Rendez-vous annulé",
                f"Le prestataire a annulé le rendez-vous du {appointment.date}.",
                appointment,
            )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


class AppointmentAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = Appointment.objects.select_related("client", "employer").filter(pk=pk).first()
        if not appointment:
            return Response({"detail": "Rendez-vous introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(request.user, "employer") or appointment.employer_id != request.user.employer.id:
            raise PermissionDenied("Seul le prestataire concerné peut accepter ce rendez-vous.")

        if appointment.status in [Appointment.Status.CANCELED, Appointment.Status.REFUSED, Appointment.Status.COMPLETED]:
            return Response({"detail": "Ce rendez-vous ne peut plus être accepté."}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = Appointment.Status.ACCEPTED
        appointment.save(update_fields=["status", "updated_at"])

        create_notification(
            appointment.client.user,
            "appointment_accepted",
            "Rendez-vous accepté",
            f"Votre rendez-vous du {appointment.date} a été accepté.",
            appointment,
        )
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


class AppointmentRefuseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = Appointment.objects.select_related("client", "employer").filter(pk=pk).first()
        if not appointment:
            return Response({"detail": "Rendez-vous introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(request.user, "employer") or appointment.employer_id != request.user.employer.id:
            raise PermissionDenied("Seul le prestataire concerné peut refuser ce rendez-vous.")

        if appointment.status in [Appointment.Status.CANCELED, Appointment.Status.REFUSED, Appointment.Status.COMPLETED]:
            return Response({"detail": "Ce rendez-vous ne peut plus être refusé."}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get("reason") or "").strip()
        appointment.status = Appointment.Status.REFUSED
        if reason:
            appointment.cancel_reason = reason
            appointment.save(update_fields=["status", "cancel_reason", "updated_at"])
        else:
            appointment.save(update_fields=["status", "updated_at"])

        create_notification(
            appointment.client.user,
            "appointment_refused",
            "Rendez-vous refusé",
            f"Votre rendez-vous du {appointment.date} a été refusé.",
            appointment,
        )
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


class AppointmentReview(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = user_appointments_queryset(request.user).filter(pk=pk).first()
        if not appointment:
            return Response({"detail": "Rendez-vous introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(request.user, "client") or appointment.client != request.user.client:
            raise PermissionDenied("Seul le client concerné peut laisser un avis.")

        serializer = AppointmentReviewLegacySerializer(appointment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AppointmentSerializer(appointment).data)


class AddReview(AppointmentReview):
    def put(self, request, pk):
        return self.post(request, pk)


class ReviewListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Review.objects.select_related("client", "employer", "appointment").all().order_by("-created_at")
        employer_id = request.query_params.get("employer_id")
        if employer_id and employer_id.isdigit():
            qs = qs.filter(employer_id=int(employer_id))
        return Response(ReviewSerializer(qs, many=True).data)

    def post(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Seul un client peut déposer un avis.")

        serializer = ReviewSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        appointment = serializer.validated_data["appointment"]
        if appointment.client_id != request.user.client.id:
            raise PermissionDenied("Vous ne pouvez noter que vos propres rendez-vous.")

        review, _created = Review.objects.update_or_create(
            appointment=appointment,
            defaults={
                "client": request.user.client,
                "employer": appointment.employer,
                "rating": serializer.validated_data["rating"],
                "comment": serializer.validated_data.get("comment", ""),
                "is_published": serializer.validated_data.get("is_published", True),
            },
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


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
        appointment.save(update_fields=["payment_method", "is_paid", "updated_at"])
        return Response(AppointmentSerializer(appointment).data)


class ProcessPayment(AppointmentPayment):
    def post(self, request, appointment_id):
        return super().post(request, appointment_id)


# ----------------------------
# Favorites
# ----------------------------

class FavoriteServiceListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client requis.")
        qs = FavoriteService.objects.select_related("service", "client").filter(client=request.user.client)
        return Response(FavoriteServiceSerializer(qs, many=True, context={"client": request.user.client}).data)

    def post(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client requis.")
        serializer = FavoriteServiceSerializer(data=request.data, context={"client": request.user.client})
        serializer.is_valid(raise_exception=True)
        favorite = FavoriteService.objects.create(client=request.user.client, **serializer.validated_data)
        return Response(FavoriteServiceSerializer(favorite, context={"client": request.user.client}).data, status=status.HTTP_201_CREATED)


class FavoriteServiceDetail(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client requis.")
        fav = FavoriteService.objects.filter(pk=pk, client=request.user.client).first()
        if not fav:
            return Response({"detail": "Favori introuvable."}, status=status.HTTP_404_NOT_FOUND)
        fav.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FavoriteEmployerListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client requis.")
        qs = FavoriteEmployer.objects.select_related("employer", "client").filter(client=request.user.client)
        return Response(FavoriteEmployerSerializer(qs, many=True, context={"client": request.user.client}).data)

    def post(self, request):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client requis.")
        serializer = FavoriteEmployerSerializer(data=request.data, context={"client": request.user.client})
        serializer.is_valid(raise_exception=True)
        favorite = FavoriteEmployer.objects.create(client=request.user.client, **serializer.validated_data)
        return Response(FavoriteEmployerSerializer(favorite, context={"client": request.user.client}).data, status=status.HTTP_201_CREATED)


class FavoriteEmployerDetail(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not hasattr(request.user, "client"):
            raise PermissionDenied("Profil client requis.")
        fav = FavoriteEmployer.objects.filter(pk=pk, client=request.user.client).first()
        if not fav:
            return Response({"detail": "Favori introuvable."}, status=status.HTTP_404_NOT_FOUND)
        fav.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ----------------------------
# Messaging
# ----------------------------

class ConversationListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Conversation.objects.select_related("client", "employer", "client__user", "employer__user").filter(
            Q(client__user=request.user) | Q(employer__user=request.user)
        ).order_by("-updated_at")

        serialized = ConversationSerializer(qs, many=True).data
        enriched = []
        for item in serialized:
            convo = qs.filter(pk=item["id"]).first()
            unread_count = 0
            if convo:
                unread_count = convo.messages.exclude(sender_user=request.user).filter(is_read=False).count()
            item["unread_count"] = unread_count
            enriched.append(item)
        return Response(enriched)

    def post(self, request):
        serializer = ConversationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        return Response(ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)


class MessageListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversation_id = request.query_params.get("conversation_id")
        if not conversation_id or not conversation_id.isdigit():
            return Response({"detail": "conversation_id requis."}, status=status.HTTP_400_BAD_REQUEST)

        conversation = Conversation.objects.filter(pk=int(conversation_id), is_active=True).first()
        if not conversation:
            return Response({"detail": "Conversation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id not in (conversation.client.user_id, conversation.employer.user_id):
            raise PermissionDenied("Non autorisé.")

        qs = Message.objects.select_related("sender_user", "conversation").filter(conversation=conversation).order_by("created_at")
        return Response(MessageSerializer(qs, many=True).data)

    def post(self, request):
        serializer = MessageCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        msg = serializer.save()
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class MarkConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        conversation_id = request.data.get("conversation_id")
        if not conversation_id or not str(conversation_id).isdigit():
            return Response({"detail": "conversation_id requis."}, status=status.HTTP_400_BAD_REQUEST)

        conversation = Conversation.objects.filter(pk=int(conversation_id), is_active=True).first()
        if not conversation:
            return Response({"detail": "Conversation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id not in (conversation.client.user_id, conversation.employer.user_id):
            raise PermissionDenied("Non autorisé.")

        updated = Message.objects.filter(
            conversation=conversation, is_read=False
        ).exclude(sender_user=request.user).update(is_read=True, read_at=timezone.now())

        return Response({"updated": updated}, status=status.HTTP_200_OK)


# ----------------------------
# Contact / claims
# ----------------------------

class ContactRequestCreate(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data
        if request.user and request.user.is_authenticated:
            payload["user"] = request.user

        contact = ContactRequest.objects.create(**payload)
        return Response(ContactRequestSerializer(contact).data, status=status.HTTP_201_CREATED)


# ----------------------------
# Notifications
# ----------------------------

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