from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from .models import User, Client, Employer, Service, Appointment, Notification


class CriticalEndpointsTests(APITestCase):
    def setUp(self):
        # Service
        self.service = Service.objects.create(
            name="Plomberie",
            description="Service test",
            icon="fas fa-tools",
            is_active=True,
        )
        self.other_service = Service.objects.create(
            name="Ménage",
            description="Service ménage test",
            icon="fas fa-broom",
            is_active=True,
        )

        # Client user + profile
        self.client_user = User.objects.create_user(
            username="client_test",
            email="client@test.com",
            password="test1234",
            role="client",
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            name="Client Test",
            email="client@test.com",
            phone="",
        )

        # Employer user + profile
        self.employer_user = User.objects.create_user(
            username="employer_test",
            email="employer@test.com",
            password="test1234",
            role="employer",
        )
        self.employer_profile = Employer.objects.create(
            user=self.employer_user,
            name="Employer Test",
            email="employer@test.com",
            phone="",
            service=self.service,
            is_active=True,
        )

        # Appointment futur
        self.appointment = Appointment.objects.create(
            client=self.client_profile,
            employer=self.employer_profile,
            service=self.service,
            date=timezone.now() + timedelta(days=1),
            status="accepté",
        )

        # Notification liée
        self.notification = Notification.objects.create(
            recipient=self.client_user,
            notification_type="test",
            title="Notif test",
            message="Message test",
            appointment=self.appointment,
        )

        # Auth client
        login_res = self.client.post(
            "/api/v1/auth/login/",
            {"email": "client@test.com", "password": "test1234"},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        token = login_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_mark_notification_read(self):
        url = f"/api/v1/notifications/{self.notification.id}/read/"
        res = self.client.post(url, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_add_review(self):
        url = f"/api/v1/appointments/{self.appointment.id}/add-review/"
        payload = {"feedback": "Très bon service", "rating": 5}
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.feedback, "Très bon service")
        self.assertEqual(self.appointment.rating, 5)

    def test_process_payment(self):
        url = f"/api/v1/payments/{self.appointment.id}/process/"
        payload = {"payment_method": "carte"}
        res = self.client.post(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertTrue(self.appointment.is_paid)

    def test_create_appointment_autopicks_employer_when_service_is_name(self):
        url = "/api/v1/appointments/create/"
        payload = {
            "service": "Plomberie",
            "date": (timezone.now() + timedelta(days=2)).date().isoformat(),
            "time": "10:30",
            "description": "Intervention test",
        }

        res = self.client.post(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["employer"]["id"], self.employer_profile.id)
        self.assertEqual(res.data["service"]["id"], self.service.id)

    def test_create_appointment_autopicks_employer_when_service_is_id_string(self):
        url = "/api/v1/appointments/create/"
        payload = {
            "service": str(self.service.id),
            "date": (timezone.now() + timedelta(days=3)).date().isoformat(),
            "time": "11:00",
            "description": "Intervention test ID",
        }

        res = self.client.post(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["employer"]["id"], self.employer_profile.id)
        self.assertEqual(res.data["service"]["id"], self.service.id)

    def test_create_appointment_aligns_service_with_selected_employer(self):
        url = "/api/v1/appointments/create/"
        payload = {
            "service": self.other_service.id,  # service différent du service employeur
            "employer": self.employer_profile.id,
            "date": (timezone.now() + timedelta(days=4)).date().isoformat(),
            "time": "14:00",
            "description": "Intervention avec service aligné",
        }

        res = self.client.post(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["employer"]["id"], self.employer_profile.id)
        self.assertEqual(res.data["service"]["id"], self.service.id)