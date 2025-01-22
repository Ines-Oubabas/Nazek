from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from .models import Appointment, Client, Employer, Service
from .serializers import AppointmentSerializer, ClientSerializer, EmployerSerializer
import logging

logger = logging.getLogger(__name__)

class AppointmentList(APIView):
    def get(self, request):
        appointments = Appointment.objects.all()
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CreateAppointment(APIView):
    def post(self, request):
        employer_id = request.data.get("employer")
        service_id = request.data.get("service")
        date = request.data.get("date")

        try:
            employer = Employer.objects.get(id=employer_id)
            if not employer.is_available(date):
                return Response(
                    {"error": "L'employeur n'est pas disponible à cette date."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            service = Service.objects.get(id=service_id)
        except Employer.DoesNotExist:
            return Response({"error": "Employeur non trouvé"}, status=status.HTTP_404_NOT_FOUND)
        except Service.DoesNotExist:
            return Response({"error": "Service non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Erreur de validation : {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClientList(APIView):
    def get(self, request):
        clients = Client.objects.all()
        serializer = ClientSerializer(clients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ClientProfile(APIView):
    def get(self, request):
        # Simule un client connecté
        client = Client.objects.first()  # Remplacez par la logique réelle d'authentification
        if client:
            serializer = ClientSerializer(client)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"error": "Client non trouvé"}, status=status.HTTP_404_NOT_FOUND)

class EmployerList(APIView):
    def get(self, request):
        employers = Employer.objects.all()
        serializer = EmployerSerializer(employers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UpdateEmployerProfile(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        employer = Employer.objects.first()  # Remplacez par request.user
        if not employer:
            return Response({"error": "Employeur non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        data = JSONParser().parse(request)
        serializer = EmployerSerializer(employer, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddReview(APIView):
    def post(self, request):
        appointment_id = request.data.get("appointment_id")
        feedback = request.data.get("feedback")
        rating = request.data.get("rating")

        try:
            appointment = Appointment.objects.get(id=appointment_id)
            appointment.feedback = feedback
            appointment.rating = rating
            appointment.save()
            return Response({"message": "Évaluation ajoutée avec succès"}, status=status.HTTP_200_OK)
        except Appointment.DoesNotExist:
            return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)
