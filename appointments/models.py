from django.db import models
from django.utils import timezone


class Service(models.Model):
    """Modèle pour les services proposés."""

    name = models.CharField(max_length=100, verbose_name="Nom du service")
    description = models.TextField(verbose_name="Description du service")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"


class Employer(models.Model):
    """Modèle pour les employeurs."""

    name = models.CharField(max_length=255, verbose_name="Nom de l'employeur")
    email = models.EmailField(unique=True, verbose_name="Email de l'employeur")
    phone = models.CharField(
        max_length=15, blank=True, null=True, verbose_name="Numéro de téléphone"
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employers",
        verbose_name="Service associé",
    )
    is_active = models.BooleanField(default=True, verbose_name="Employeur actif")
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Date d'inscription"
    )  # ✅ Correction pour éviter l'erreur de colonne manquante

    def __str__(self):
        return self.name

    def is_available(self, date):
        """Vérifie si l'employeur est disponible pour un rendez-vous."""
        return not self.appointments.filter(date=date).exists()

    class Meta:
        verbose_name = "Employeur"
        verbose_name_plural = "Employeurs"


class Client(models.Model):
    """Modèle pour les clients."""

    name = models.CharField(max_length=100, verbose_name="Nom du client")
    email = models.EmailField(unique=True, verbose_name="Email du client")
    phone = models.CharField(max_length=15, verbose_name="Numéro de téléphone")
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Date d'inscription"
    )  # ✅ Correction ici

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"


class Appointment(models.Model):
    """Modèle pour les rendez-vous."""

    STATUS_CHOICES = [
        ("en attente", "En attente"),
        ("confirmé", "Confirmé"),
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
        default="en attente",
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
    feedback = models.TextField(blank=True, null=True, verbose_name="Feedback")
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        blank=True,
        null=True,
        verbose_name="Évaluation",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Créé le"
    )  # ✅ Correction ici

    class Meta:
        ordering = ["-date"]
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous"

    def __str__(self):
        return f"{self.client.name} - {self.employer.name} - {self.date}"

    def is_upcoming(self):
        """Vérifie si le rendez-vous est à venir."""
        return self.date > timezone.now()
