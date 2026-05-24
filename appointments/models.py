from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class User(AbstractUser):
    """
    Compatibilité temporaire conservée :
    - role (utilisé dans views/serializers/frontend actuels)
    - phone, address, profile_picture (déjà attendus)
    """

    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        EMPLOYER = "employer", "Prestataire"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name="Rôle principal",
        help_text="Compatibilité legacy : un utilisateur peut aussi avoir les 2 profils.",
    )
    phone = models.CharField(max_length=20, blank=True, default="", verbose_name="Téléphone")
    address = models.TextField(blank=True, default="", verbose_name="Adresse")
    profile_picture = models.ImageField(upload_to="users/profile_pics/", null=True, blank=True)

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        base = self.get_full_name().strip() or self.username
        return f"{base} ({self.email or 'sans email'})"

    @property
    def has_client_profile(self) -> bool:
        return hasattr(self, "client")

    @property
    def has_employer_profile(self) -> bool:
        return hasattr(self, "employer")


class Service(models.Model):
    # On garde les champs legacy (name/description/icon/is_active)
    name = models.CharField(max_length=120, unique=True, verbose_name="Nom du service")
    description = models.TextField(blank=True, default="", verbose_name="Description du service")
    icon = models.CharField(max_length=80, blank=True, default="fas fa-tools", verbose_name="Icône")
    is_active = models.BooleanField(default=True, verbose_name="Service actif")

    # Ajouts sûrs (non cassants)
    slug = models.SlugField(max_length=140, unique=True, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self):
        return self.name


class Employer(models.Model):
    """
    On conserve les noms legacy :
    - related_name='employer'
    - name, email, phone, service, description...
    pour éviter de casser serializers/views actuels.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employer",
    )
    name = models.CharField(max_length=255, verbose_name="Nom du prestataire")
    email = models.EmailField(unique=True, db_index=True, verbose_name="Email du prestataire")
    phone = models.CharField(max_length=20, blank=True, default="", verbose_name="Numéro de téléphone")

    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employers",
        verbose_name="Service associé",
    )

    is_active = models.BooleanField(default=True, verbose_name="Prestataire actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    updated_at = models.DateTimeField(auto_now=True)

    profile_picture = models.ImageField(upload_to="employer_pics/", null=True, blank=True)
    description = models.TextField(blank=True, default="", verbose_name="Description")

    average_rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
    )
    total_reviews = models.PositiveIntegerField(default=0)

    is_verified = models.BooleanField(default=False, verbose_name="Prestataire vérifié")
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Tarif horaire",
    )

    # Ajouts non cassants pour recherche/filtres
    city = models.CharField(max_length=120, blank=True, default="", verbose_name="Ville")
    address = models.TextField(blank=True, default="", verbose_name="Adresse pro")

    class Meta:
        ordering = ["-is_verified", "-average_rating", "name"]
        verbose_name = "Prestataire"
        verbose_name_plural = "Prestataires"

    def __str__(self):
        return self.name

    def is_available(self, date_dt):
        # Compat legacy : utilisé par l'existant
        return not self.employer_appointments.filter(date=date_dt).exclude(
            status=Appointment.Status.CANCELED
        ).exists()

    def update_rating(self, new_rating: int):
        self.total_reviews += 1
        self.average_rating = ((self.average_rating * (self.total_reviews - 1)) + new_rating) / self.total_reviews
        self.save(update_fields=["total_reviews", "average_rating", "updated_at"])

    def recalculate_rating_from_reviews(self):
        qs = self.reviews.filter(is_published=True)
        self.total_reviews = qs.count()
        if self.total_reviews == 0:
            self.average_rating = 0.0
        else:
            avg = qs.aggregate(models.Avg("rating"))["rating__avg"] or 0
            self.average_rating = round(float(avg), 2)
        self.save(update_fields=["total_reviews", "average_rating", "updated_at"])


class Availability(models.Model):
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE, related_name="availabilities")
    day_of_week = models.IntegerField(
        choices=[
            (0, "Lundi"),
            (1, "Mardi"),
            (2, "Mercredi"),
            (3, "Jeudi"),
            (4, "Vendredi"),
            (5, "Samedi"),
            (6, "Dimanche"),
        ]
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    def clean(self):
        super().clean()
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({"end_time": "L'heure de fin doit être après l'heure de début."})

    class Meta:
        verbose_name = "Disponibilité"
        verbose_name_plural = "Disponibilités"
        unique_together = [("employer", "day_of_week", "start_time", "end_time")]
        ordering = ["employer_id", "day_of_week", "start_time"]

    def __str__(self):
        return f"{self.employer.name} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"


class Client(models.Model):
    """
    Conserve related_name='client' + champs legacy.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client",
    )
    name = models.CharField(max_length=160, verbose_name="Nom du client")
    email = models.EmailField(unique=True, db_index=True, verbose_name="Email du client")
    phone = models.CharField(max_length=20, blank=True, default="", verbose_name="Numéro de téléphone")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    updated_at = models.DateTimeField(auto_now=True)

    profile_picture = models.ImageField(upload_to="client_pics/", null=True, blank=True)
    address = models.TextField(blank=True, default="", verbose_name="Adresse")
    city = models.CharField(max_length=120, blank=True, default="", verbose_name="Ville")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Client"
        verbose_name_plural = "Clients"

    def __str__(self):
        return self.name


class Appointment(models.Model):
    """
    Compatibilité conservée :
    - champ `date` conservé (front/back actuels)
    - related_name legacy conservés
    - ajout d'annulation non destructive
    """

    class Status(models.TextChoices):
        PENDING = "en_attente", "En attente"
        ACCEPTED = "accepté", "Accepté"   # conserver l'accent pour compat legacy data/code
        REFUSED = "refusé", "Refusé"
        IN_PROGRESS = "en_cours", "En cours"
        COMPLETED = "terminé", "Terminé"
        CANCELED = "annulé", "Annulé"

    class CancelledBy(models.TextChoices):
        CLIENT = "client", "Client"
        EMPLOYER = "prestataire", "Prestataire"
        SYSTEM = "systeme", "Système"

    class Payment(models.TextChoices):
        CARD = "carte", "Carte Dahabiya"
        CASH = "especes", "Espèces"

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="client_appointments",
        verbose_name="Client",
    )
    employer = models.ForeignKey(
        Employer,
        on_delete=models.CASCADE,
        related_name="employer_appointments",
        verbose_name="Prestataire",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_appointments",
        verbose_name="Service",
    )

    # Champ legacy conservé
    date = models.DateTimeField(verbose_name="Date du rendez-vous")

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Statut",
    )

    description = models.TextField(blank=True, default="", verbose_name="Description")
    payment_method = models.CharField(
        max_length=20,
        choices=Payment.choices,
        default=Payment.CASH,
        verbose_name="Mode de paiement",
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Montant total")
    is_paid = models.BooleanField(default=False)

    # Legacy review fields conservés pour éviter cassure immédiate
    feedback = models.TextField(blank=True, default="", verbose_name="Feedback")
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        blank=True,
        null=True,
        verbose_name="Évaluation",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True)
    estimated_duration = models.IntegerField(help_text="Durée estimée en minutes", null=True, blank=True)
    location = models.TextField(blank=True, default="", help_text="Adresse du rendez-vous")

    # Ajout annulation non destructive
    canceled_at = models.DateTimeField(null=True, blank=True)
    canceled_by = models.CharField(max_length=20, choices=CancelledBy.choices, blank=True, default="")
    cancel_reason = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-date"]
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["date"]),
            models.Index(fields=["client", "date"]),
            models.Index(fields=["employer", "date"]),
        ]

    def __str__(self):
        return f"{self.client.name} - {self.employer.name} - {self.date}"

    def clean(self):
        super().clean()
        if self.date and self.date <= timezone.now() and not self.pk:
            raise ValidationError({"date": "La date du rendez-vous doit être dans le futur."})

    def is_upcoming(self):
        return self.date > timezone.now()

    def save(self, *args, **kwargs):
        if self.rating and not self.feedback:
            self.feedback = "Avis sans commentaire"
        super().save(*args, **kwargs)

    def cancel(self, by: str, reason: str = ""):
        self.status = self.Status.CANCELED
        self.canceled_at = timezone.now()
        self.canceled_by = by
        self.cancel_reason = reason or ""
        self.save(update_fields=["status", "canceled_at", "canceled_by", "cancel_reason", "updated_at"])


class Review(models.Model):
    """
    Nouveau modèle d'avis structuré (non destructif pour l'existant).
    1 avis structuré max par rendez-vous.
    """
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name="structured_review",
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="reviews")
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, default="")
    is_published = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Avis"
        verbose_name_plural = "Avis"
        constraints = [
            models.CheckConstraint(check=Q(rating__gte=1) & Q(rating__lte=5), name="review_rating_between_1_5"),
        ]

    def __str__(self):
        return f"Avis {self.rating}/5 - {self.client.name} -> {self.employer.name}"

    def clean(self):
        super().clean()
        if self.appointment_id:
            if self.appointment.client_id != self.client_id:
                raise ValidationError("Le client de l'avis doit correspondre au client du rendez-vous.")
            if self.appointment.employer_id != self.employer_id:
                raise ValidationError("Le prestataire de l'avis doit correspondre au prestataire du rendez-vous.")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.employer.recalculate_rating_from_reviews()


class FavoriteService(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="favorite_services")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="favorited_by_clients")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Service favori"
        verbose_name_plural = "Services favoris"
        unique_together = [("client", "service")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.client.name} ❤️ {self.service.name}"


class FavoriteEmployer(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="favorite_employers")
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE, related_name="favorited_by_clients")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Prestataire favori"
        verbose_name_plural = "Prestataires favoris"
        unique_together = [("client", "employer")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.client.name} ❤️ {self.employer.name}"


class Conversation(models.Model):
    """
    Conversation unique par couple (client, prestataire).
    """
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="conversations")
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE, related_name="conversations")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"
        unique_together = [("client", "employer")]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Conversation {self.client.name} ↔ {self.employer.name}"


class Message(models.Model):
    class SenderType(models.TextChoices):
        CLIENT = "client", "Client"
        EMPLOYER = "prestataire", "Prestataire"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    sender_type = models.CharField(max_length=20, choices=SenderType.choices)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["is_read"]),
        ]

    def __str__(self):
        return f"{self.sender_type} - {self.created_at:%Y-%m-%d %H:%M}"

    def clean(self):
        super().clean()
        allowed_user_ids = {self.conversation.client.user_id, self.conversation.employer.user_id}
        if self.sender_user_id not in allowed_user_ids:
            raise ValidationError("L'expéditeur n'appartient pas à cette conversation.")


class ContactRequest(models.Model):
    class Status(models.TextChoices):
        OPEN = "ouvert", "Ouvert"
        IN_PROGRESS = "en_cours", "En cours"
        CLOSED = "ferme", "Fermé"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contact_requests",
    )
    full_name = models.CharField(max_length=160)
    email = models.EmailField(db_index=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Demande de contact"
        verbose_name_plural = "Demandes de contact"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.status}] {self.subject} - {self.email}"


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"