from django.contrib.auth import get_user_model, authenticate, login, logout
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Appointment, Client, Employer, Service
from .serializers import (
    AppointmentSerializer,
    AppointmentReviewSerializer,
    ClientSerializer,
    EmployerSerializer,
    EmployerUpdateSerializer,
    ServiceSerializer,
)

User = get_user_model()


def get_tokens_for_user(user):
    """Générer un token JWT pour un utilisateur."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


### 🔹 AUTHENTIFICATION ###
class RegisterUser(APIView):
    """Vue pour l'inscription des utilisateurs."""

    def post(self, request):
        data = request.data
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "client")  # ✅ Ajout du rôle par défaut

        if not username or not email or not password:
            return Response({"error": "Tous les champs sont obligatoires."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Cet email est déjà utilisé."}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Ce nom d'utilisateur est déjà pris."}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()

        tokens = get_tokens_for_user(user)  # ✅ Retourner JWT

        return Response(
            {"message": "Utilisateur créé avec succès.", "username": user.username, "tokens": tokens},
            status=201,
        )


class LoginUser(APIView):
    """Vue pour la connexion des utilisateurs."""

    def post(self, request):
        data = request.data
        email = data.get("email")
        password = data.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Email ou mot de passe incorrect."}, status=400)

        user = authenticate(request, username=user.username, password=password)

        if user:
            login(request, user)
            tokens = get_tokens_for_user(user)
            return Response(
                {"message": "Connexion réussie.", "username": user.username, "tokens": tokens},
                status=200,
            )

        return Response({"error": "Email ou mot de passe incorrect."}, status=400)


class LogoutUser(APIView):
    """Vue pour la déconnexion des utilisateurs."""

    def post(self, request):
        logout(request)
        return Response({"message": "Déconnexion réussie."}, status=200)


### 🔹 GESTION DES RENDEZ-VOUS ###
class AppointmentList(generics.ListCreateAPIView):
    """Vue pour lister et créer des rendez-vous."""
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.all()


class CreateAppointment(generics.CreateAPIView):
    """Vue pour créer un rendez-vous."""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    def perform_create(self, serializer):
        """Vérifie que le client et l'employeur existent avant de créer un rendez-vous."""
        client = serializer.validated_data.get("client")
        employer = serializer.validated_data.get("employer")

        if not Client.objects.filter(id=client.id).exists():
            raise ValueError("Client introuvable.")
        if not Employer.objects.filter(id=employer.id).exists():
            raise ValueError("Employeur introuvable.")

        serializer.save()


class AppointmentDetail(RetrieveUpdateDestroyAPIView):
    """Vue pour récupérer, mettre à jour et supprimer un rendez-vous spécifique."""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer


### 🔹 CLIENTS ###
class ClientList(generics.ListAPIView):
    """Vue pour récupérer tous les clients."""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class ClientProfile(generics.RetrieveUpdateAPIView):
    """Vue pour récupérer et mettre à jour le profil d'un client."""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


### 🔹 EMPLOYEURS ###
class EmployerList(generics.ListCreateAPIView):
    """Vue pour lister et créer des employeurs."""
    queryset = Employer.objects.all()
    serializer_class = EmployerSerializer


class UpdateEmployerProfile(generics.RetrieveUpdateAPIView):
    """Vue pour mettre à jour le profil d'un employeur."""
    queryset = Employer.objects.all()
    serializer_class = EmployerUpdateSerializer


### 🔹 SERVICES ###
class ServiceList(ListAPIView):
    """Vue pour récupérer tous les services."""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class ServiceDetail(RetrieveUpdateDestroyAPIView):
    """Vue pour récupérer, mettre à jour ou supprimer un service."""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


### 🔹 AVIS ET NOTES ###
class AddReview(generics.UpdateAPIView):
    """Vue pour ajouter un avis à un rendez-vous."""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentReviewSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        feedback = request.data.get("feedback")
        rating = request.data.get("rating")

        if feedback is None or rating is None:
            return Response(
                {"error": "Les champs 'feedback' et 'rating' sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.feedback = feedback
        instance.rating = rating
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
