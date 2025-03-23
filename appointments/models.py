from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class Service(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nom du service")
    description = models.TextField(verbose_name="Description du service")
    icon = models.CharField(max_length=50, default="fas fa-tools", verbose_name="Icône")
    is_active = models.BooleanField(default=True, verbose_name="Service actif")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"


class Availability(models.Model):
    employer = models.ForeignKey('Employer', on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=[
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
        (5, 'Samedi'),
        (6, 'Dimanche')
    ])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Disponibilité"
        verbose_name_plural = "Disponibilités"
        unique_together = ['employer', 'day_of_week', 'start_time', 'end_time']


class Employer(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employer'
    )
    name = models.CharField(max_length=255, verbose_name="Nom de l'employeur")
    email = models.EmailField(unique=True, verbose_name="Email de l'employeur")
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name="Numéro de téléphone")
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employers",
        verbose_name="Service associé",
    )
    is_active = models.BooleanField(default=True, verbose_name="Employeur actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    profile_picture = models.ImageField(upload_to='employer_pics/', null=True, blank=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    average_rating = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    total_reviews = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False, verbose_name="Employeur vérifié")
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Tarif horaire")

    def __str__(self):
        return self.name

    def is_available(self, date):
        return not self.employer_appointments.filter(date=date).exists()

    def update_rating(self, new_rating):
        self.total_reviews += 1
        self.average_rating = ((self.average_rating * (self.total_reviews - 1)) + new_rating) / self.total_reviews
        self.save()

    class Meta:
        verbose_name = "Employeur"
        verbose_name_plural = "Employeurs"


class Client(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client'
    )
    name = models.CharField(max_length=100, verbose_name="Nom du client")
    email = models.EmailField(unique=True, verbose_name="Email du client")
    phone = models.CharField(max_length=15, verbose_name="Numéro de téléphone")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    profile_picture = models.ImageField(upload_to='client_pics/', null=True, blank=True)
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    appointment = models.ForeignKey(
        'Appointment',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ("en_attente", "En attente"),
        ("accepté", "Accepté"),
        ("refusé", "Refusé"),
        ("en_cours", "En cours"),
        ("terminé", "Terminé"),
        ("annulé", "Annulé"),
    ]

    PAYMENT_CHOICES = [
        ("carte", "Carte Dahabiya"),
        ("especes", "Espèces"),
    ]

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
        verbose_name="Employeur",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_appointments",
        verbose_name="Service",
    )
    date = models.DateTimeField(verbose_name="Date du rendez-vous")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="en_attente",
        verbose_name="Statut",
    )
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default="especes",
        verbose_name="Mode de paiement",
    )
    total_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00, verbose_name="Montant total"
    )
    is_paid = models.BooleanField(default=False)
    feedback = models.TextField(blank=True, null=True, verbose_name="Feedback")
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        blank=True,
        null=True,
        verbose_name="Évaluation",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    estimated_duration = models.IntegerField(help_text="Durée estimée en minutes", null=True, blank=True)
    location = models.TextField(blank=True, null=True, help_text="Adresse du rendez-vous")

    def __str__(self):
        return f"{self.client.name} - {self.employer.name} - {self.date}"

    def is_upcoming(self):
        return self.date > timezone.now()

    def save(self, *args, **kwargs):
        if self.rating and not self.feedback:
            self.feedback = "Avis sans commentaire"
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous"


class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Client'),
        ('employer', 'Employeur'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return self.username
