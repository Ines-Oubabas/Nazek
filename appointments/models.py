from django.db import models
from django.utils.timezone import now

# Modèle pour les services
class Service(models.Model):
    name = models.CharField(
        max_length=100,
        verbose_name="Nom du service",
        help_text="Entrez le nom du service (ex. Electricité, Plomberie)."
    )
    description = models.TextField(
        verbose_name="Description du service",
        help_text="Donnez une brève description du service."
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"


# Modèle pour les employeurs
class Employer(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name="Nom de l'employeur",
        help_text="Entrez le nom complet de l'employeur."
    )
    email = models.EmailField(
        unique=True,
        verbose_name="Email de l'employeur",
        help_text="Entrez une adresse email unique."
    )
    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        verbose_name="Numéro de téléphone",
        help_text="Entrez un numéro de téléphone (facultatif)."
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Service associé",
        help_text="Sélectionnez le service fourni par cet employeur."
    )

    def __str__(self):
        return self.name

    def is_available(self, date):
        """Vérifie si l'employeur est disponible pour un rendez-vous à une date donnée."""
        return not self.appointments.filter(date=date).exists()

    class Meta:
        verbose_name = "Employeur"
        verbose_name_plural = "Employeurs"


# Modèle pour les clients
class Client(models.Model):
    name = models.CharField(
        max_length=100,
        verbose_name="Nom du client",
        help_text="Entrez le nom complet du client."
    )
    email = models.EmailField(
        unique=True,
        verbose_name="Email du client",
        help_text="Entrez une adresse email unique."
    )
    phone = models.CharField(
        max_length=15,
        verbose_name="Numéro de téléphone",
        help_text="Entrez un numéro de téléphone."
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"


# Modèle pour les rendez-vous
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('en attente', 'En attente'),
        ('terminé', 'Terminé'),
    ]

    PAYMENT_CHOICES = [
        ('carte', 'Carte Dahabiya'),
        ('especes', 'Espèces'),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name="Client",
        help_text="Sélectionnez le client associé au rendez-vous."
    )
    employer = models.ForeignKey(
        Employer,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name="Employeur",
        help_text="Sélectionnez l'employeur associé au rendez-vous."
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Service",
        help_text="Sélectionnez le service pour ce rendez-vous."
    )
    date = models.DateTimeField(
        verbose_name="Date du rendez-vous",
        help_text="Entrez la date et l'heure du rendez-vous."
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='en attente',
        verbose_name="Statut",
        help_text="Statut actuel du rendez-vous."
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description",
        help_text="Entrez une description pour le rendez-vous (facultatif)."
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default='especes',
        verbose_name="Mode de paiement",
        help_text="Sélectionnez le mode de paiement."
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name="Montant total",
        help_text="Entrez le montant total du rendez-vous."
    )
    feedback = models.TextField(
        blank=True,
        null=True,
        verbose_name="Feedback",
        help_text="Feedback ou retour sur le rendez-vous (facultatif)."
    )
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        blank=True,
        null=True,
        verbose_name="Évaluation",
        help_text="Évaluation du service (1 à 5 étoiles)."
    )

    class Meta:
        ordering = ['-date']
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous"

    def __str__(self):
        return f"{self.client.name} - {self.employer.name} - {self.date}"

    def is_upcoming(self):
        """Vérifie si le rendez-vous est à venir."""
        return self.date > now()
