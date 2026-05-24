from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

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

User = get_user_model()


# ----------------------------
# Helpers
# ----------------------------

def normalize_email(value: str) -> str:
    return (value or "").strip().lower()


# ----------------------------
# Service
# ----------------------------

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "is_active",
            "slug",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


# ----------------------------
# Availability
# ----------------------------

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


# ----------------------------
# User
# ----------------------------

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    has_client_profile = serializers.SerializerMethodField(read_only=True)
    has_employer_profile = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",  # legacy compatibility
            "phone",
            "address",
            "profile_picture",
            "password",
            "has_client_profile",
            "has_employer_profile",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["date_joined", "is_active"]

    def get_has_client_profile(self, obj):
        return hasattr(obj, "client")

    def get_has_employer_profile(self, obj):
        return hasattr(obj, "employer")

    def validate_email(self, value):
        value = normalize_email(value)
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Cette adresse email utilisateur existe déjà.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        email = validated_data.get("email")
        if email:
            validated_data["email"] = normalize_email(email)

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        if "email" in validated_data:
            validated_data["email"] = normalize_email(validated_data["email"])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


# ----------------------------
# Client / Employer profiles
# ----------------------------

class ClientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Client
        fields = [
            "id",
            "user",
            "name",  # legacy compatibility
            "email",
            "phone",
            "address",
            "city",
            "is_active",
            "profile_picture",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_email(self, value):
        value = normalize_email(value)
        qs = Client.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Cette adresse email client existe déjà.")
        return value


class EmployerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source="service",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Employer
        fields = [
            "id",
            "user",
            "name",  # legacy compatibility
            "email",
            "phone",
            "service",
            "service_id",
            "description",
            "city",
            "address",
            "profile_picture",
            "is_active",
            "is_verified",
            "hourly_rate",
            "average_rating",
            "total_reviews",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "is_verified",
            "average_rating",
            "total_reviews",
            "created_at",
            "updated_at",
        ]

    def validate_email(self, value):
        value = normalize_email(value)
        qs = Employer.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Cette adresse email prestataire existe déjà.")
        return value


class ClientProfileUpsertSerializer(serializers.Serializer):
    """
    Prépare PATCH/PUT profil client : création si absent, update sinon.
    """
    name = serializers.CharField(required=False, allow_blank=False, max_length=160)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True, max_length=120)
    is_active = serializers.BooleanField(required=False)

    def validate_email(self, value):
        value = normalize_email(value)
        user = self.context["request"].user
        qs = Client.objects.filter(email__iexact=value)
        if hasattr(user, "client"):
            qs = qs.exclude(pk=user.client.pk)
        if qs.exists():
            raise serializers.ValidationError("Cette adresse email client existe déjà.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        data = self.validated_data.copy()

        if "email" in data:
            data["email"] = normalize_email(data["email"])

        if hasattr(user, "client"):
            client = user.client
            for key, value in data.items():
                setattr(client, key, value)
            client.save()
            return client

        # création profil client
        default_name = f"{user.first_name} {user.last_name}".strip() or user.username
        client = Client.objects.create(
            user=user,
            name=data.get("name", default_name),
            email=data.get("email", normalize_email(user.email)),
            phone=data.get("phone", user.phone or ""),
            address=data.get("address", user.address or ""),
            city=data.get("city", ""),
            is_active=data.get("is_active", True),
        )
        return client


class EmployerProfileUpsertSerializer(serializers.Serializer):
    """
    Prépare PATCH/PUT profil prestataire : création si absent, update sinon.
    """
    name = serializers.CharField(required=False, allow_blank=False, max_length=255)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source="service",
        required=False,
        allow_null=True,
    )
    description = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True, max_length=120)
    address = serializers.CharField(required=False, allow_blank=True)
    hourly_rate = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    is_active = serializers.BooleanField(required=False)

    def validate_email(self, value):
        value = normalize_email(value)
        user = self.context["request"].user
        qs = Employer.objects.filter(email__iexact=value)
        if hasattr(user, "employer"):
            qs = qs.exclude(pk=user.employer.pk)
        if qs.exists():
            raise serializers.ValidationError("Cette adresse email prestataire existe déjà.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        data = self.validated_data.copy()

        if "email" in data:
            data["email"] = normalize_email(data["email"])

        if hasattr(user, "employer"):
            employer = user.employer
            for key, value in data.items():
                setattr(employer, key, value)
            employer.save()
            return employer

        # création profil prestataire
        default_name = f"{user.first_name} {user.last_name}".strip() or user.username
        employer = Employer.objects.create(
            user=user,
            name=data.get("name", default_name),
            email=data.get("email", normalize_email(user.email)),
            phone=data.get("phone", user.phone or ""),
            service=data.get("service"),
            description=data.get("description", ""),
            city=data.get("city", ""),
            address=data.get("address", user.address or ""),
            hourly_rate=data.get("hourly_rate"),
            is_active=data.get("is_active", True),
        )
        return employer


# ----------------------------
# Register / account creation
# ----------------------------

class RegisterSerializer(serializers.Serializer):
    """
    Permet de créer :
      - utilisateur seul
      - utilisateur + profil client
      - utilisateur + profil prestataire
      - utilisateur + les deux profils
    """
    # user
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    # toggles
    create_client_profile = serializers.BooleanField(required=False, default=True)
    create_employer_profile = serializers.BooleanField(required=False, default=False)

    # client profile data
    client_name = serializers.CharField(required=False, allow_blank=True)
    client_email = serializers.EmailField(required=False)

    # employer profile data
    employer_name = serializers.CharField(required=False, allow_blank=True)
    employer_email = serializers.EmailField(required=False)
    employer_service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        source="employer_service",
    )
    employer_description = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        value = normalize_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Cette adresse email utilisateur existe déjà.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        # compat legacy : si role=employer et pas de toggles, on active employeur
        role = attrs.get("role")
        create_client = attrs.get("create_client_profile", True)
        create_employer = attrs.get("create_employer_profile", False)

        if role == User.Role.EMPLOYER and "create_employer_profile" not in self.initial_data:
            create_employer = True
        if role == User.Role.CLIENT and "create_client_profile" not in self.initial_data:
            create_client = True

        if not create_client and not create_employer:
            raise serializers.ValidationError(
                "Vous devez créer au moins un profil (client et/ou prestataire)."
            )

        attrs["create_client_profile"] = create_client
        attrs["create_employer_profile"] = create_employer

        user_email = normalize_email(attrs["email"])
        client_email = normalize_email(attrs.get("client_email") or user_email)
        employer_email = normalize_email(attrs.get("employer_email") or user_email)

        if create_client:
            qs_client = Client.objects.filter(email__iexact=client_email)
            if qs_client.exists():
                raise serializers.ValidationError({"client_email": "Cette adresse email client existe déjà."})

        if create_employer:
            qs_employer = Employer.objects.filter(email__iexact=employer_email)
            if qs_employer.exists():
                raise serializers.ValidationError({"employer_email": "Cette adresse email prestataire existe déjà."})

        # NB: client_email == employer_email est AUTORISÉ (dans 2 tables différentes)
        return attrs

    def create(self, validated_data):
        username = (validated_data.get("username") or "").strip()
        email = normalize_email(validated_data["email"])
        password = validated_data["password"]
        first_name = (validated_data.get("first_name") or "").strip()
        last_name = (validated_data.get("last_name") or "").strip()
        phone = (validated_data.get("phone") or "").strip()
        address = (validated_data.get("address") or "").strip()

        create_client = validated_data["create_client_profile"]
        create_employer = validated_data["create_employer_profile"]

        if not username:
            base = email.split("@")[0] or "user"
            username = base
            i = 0
            while User.objects.filter(username=username).exists():
                i += 1
                username = f"{base}{i}"

        role = validated_data.get("role")
        if not role:
            role = User.Role.EMPLOYER if create_employer and not create_client else User.Role.CLIENT

        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=phone,
            address=address,
        )
        user.set_password(password)
        user.save()

        full_name = f"{first_name} {last_name}".strip() or username

        if create_client:
            Client.objects.create(
                user=user,
                name=(validated_data.get("client_name") or full_name),
                email=normalize_email(validated_data.get("client_email") or email),
                phone=phone,
                address=address,
                city="",
                is_active=True,
            )

        if create_employer:
            Employer.objects.create(
                user=user,
                name=(validated_data.get("employer_name") or full_name),
                email=normalize_email(validated_data.get("employer_email") or email),
                phone=phone,
                service=validated_data.get("employer_service"),
                description=(validated_data.get("employer_description") or ""),
                city="",
                address=address,
                is_active=True,
            )

        return user


# ----------------------------
# Appointment
# ----------------------------

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
            "date",  # legacy compatibility
            "status",
            "description",
            "payment_method",
            "total_amount",
            "is_paid",
            "feedback",
            "rating",
            "estimated_duration",
            "location",
            "canceled_at",
            "canceled_by",
            "cancel_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "is_paid",
            "canceled_at",
            "canceled_by",
            "created_at",
            "updated_at",
        ]


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

        # collision simple sur la même date/heure, hors rendez-vous annulés/refusés
        if employer and date_value:
            conflict = employer.employer_appointments.filter(date=date_value).exclude(
                status__in=[Appointment.Status.CANCELED, Appointment.Status.REFUSED]
            )
            if conflict.exists():
                raise serializers.ValidationError({"date": "Le prestataire n'est pas disponible à cette date."})

        return attrs


class AppointmentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def save(self, **kwargs):
        appointment: Appointment = self.context["appointment"]
        canceled_by = self.context["canceled_by"]  # "client" | "prestataire" | "systeme"
        reason = self.validated_data.get("reason", "")
        appointment.cancel(by=canceled_by, reason=reason)
        return appointment


# ----------------------------
# Review / rating
# ----------------------------

class ReviewSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    employer = EmployerSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "appointment",
            "client",
            "employer",
            "rating",
            "comment",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["client", "employer", "created_at", "updated_at"]

    def validate(self, attrs):
        appointment = attrs.get("appointment") or getattr(self.instance, "appointment", None)
        rating = attrs.get("rating", getattr(self.instance, "rating", None))

        if rating is not None and not (1 <= rating <= 5):
            raise serializers.ValidationError({"rating": "La note doit être comprise entre 1 et 5."})

        if appointment and appointment.status not in [Appointment.Status.COMPLETED, Appointment.Status.ACCEPTED]:
            raise serializers.ValidationError(
                {"appointment": "Vous pouvez noter un rendez-vous accepté/terminé."}
            )
        return attrs


class AppointmentReviewLegacySerializer(serializers.ModelSerializer):
    """
    Compatibilité avec le flow legacy (feedback/rating dans Appointment),
    tout en gardant le modèle Review pour la suite.
    """
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
        if instance.status != Appointment.Status.CANCELED:
            instance.status = Appointment.Status.COMPLETED
        instance.save()

        # Synchronisation review structurée
        Review.objects.update_or_create(
            appointment=instance,
            defaults={
                "client": instance.client,
                "employer": instance.employer,
                "rating": instance.rating,
                "comment": instance.feedback or "",
                "is_published": True,
            },
        )
        return instance


# ----------------------------
# Favorites
# ----------------------------

class FavoriteServiceSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source="service",
        write_only=True,
        required=True,
    )

    class Meta:
        model = FavoriteService
        fields = ["id", "client", "service", "service_id", "created_at"]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        client = self.context.get("client")
        service = attrs.get("service")
        if client and service:
            qs = FavoriteService.objects.filter(client=client, service=service)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Ce service est déjà dans vos favoris.")
        return attrs


class FavoriteEmployerSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    employer = EmployerSerializer(read_only=True)
    employer_id = serializers.PrimaryKeyRelatedField(
        queryset=Employer.objects.filter(is_active=True),
        source="employer",
        write_only=True,
        required=True,
    )

    class Meta:
        model = FavoriteEmployer
        fields = ["id", "client", "employer", "employer_id", "created_at"]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        client = self.context.get("client")
        employer = attrs.get("employer")
        if client and employer:
            qs = FavoriteEmployer.objects.filter(client=client, employer=employer)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Ce prestataire est déjà dans vos favoris.")
        return attrs


# ----------------------------
# Messaging
# ----------------------------

class ConversationSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    employer = EmployerSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "client",
            "employer",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class ConversationCreateSerializer(serializers.Serializer):
    employer_id = serializers.PrimaryKeyRelatedField(
        queryset=Employer.objects.filter(is_active=True),
        source="employer",
        required=True,
    )

    def validate(self, attrs):
        request = self.context["request"]
        if not hasattr(request.user, "client"):
            raise serializers.ValidationError("Seul un profil client peut initier une conversation.")
        return attrs

    def create(self, validated_data):
        client = self.context["request"].user.client
        employer = validated_data["employer"]
        convo, _ = Conversation.objects.get_or_create(client=client, employer=employer)
        return convo


class MessageSerializer(serializers.ModelSerializer):
    sender_user = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender_user",
            "sender_type",
            "content",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = ["sender_user", "sender_type", "read_at", "created_at"]

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le message ne peut pas être vide.")
        return value.strip()


class MessageCreateSerializer(serializers.Serializer):
    conversation_id = serializers.PrimaryKeyRelatedField(
        queryset=Conversation.objects.filter(is_active=True),
        source="conversation",
        required=True,
    )
    content = serializers.CharField(required=True)

    def validate(self, attrs):
        request = self.context["request"]
        conversation = attrs["conversation"]

        if request.user.id not in (conversation.client.user_id, conversation.employer.user_id):
            raise serializers.ValidationError("Vous ne faites pas partie de cette conversation.")
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        conversation = validated_data["conversation"]

        if hasattr(request.user, "client") and conversation.client.user_id == request.user.id:
            sender_type = Message.SenderType.CLIENT
        elif hasattr(request.user, "employer") and conversation.employer.user_id == request.user.id:
            sender_type = Message.SenderType.EMPLOYER
        else:
            # fallback sécurité
            raise serializers.ValidationError("Expéditeur invalide pour cette conversation.")

        msg = Message.objects.create(
            conversation=conversation,
            sender_user=request.user,
            sender_type=sender_type,
            content=validated_data["content"].strip(),
        )
        conversation.save(update_fields=["updated_at"])
        return msg


# ----------------------------
# Contact request
# ----------------------------

class ContactRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = [
            "id",
            "user",
            "full_name",
            "email",
            "subject",
            "message",
            "status",
            "created_at",
            "updated_at",
            "resolved_at",
        ]
        read_only_fields = ["user", "status", "created_at", "updated_at", "resolved_at"]

    def validate_email(self, value):
        return normalize_email(value)


# ----------------------------
# Notification
# ----------------------------

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "message", "is_read", "created_at", "appointment"]
        read_only_fields = ["created_at"]


# ----------------------------
# Composite profile serializer
# ----------------------------

class MyProfilesSerializer(serializers.Serializer):
    """
    Réponse pratique pour endpoint "mon profil complet".
    """
    user = UserSerializer(read_only=True)
    client = ClientSerializer(read_only=True, allow_null=True)
    employer = EmployerSerializer(read_only=True, allow_null=True)