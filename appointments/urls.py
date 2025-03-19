"""
Ce fichier contient les urls pour gérer les rendez-vous et l'authentification.
"""

from django.urls import path
from .views import (
    AppointmentList,
    AppointmentDetail,
    CreateAppointment,
    ClientList,
    ClientProfile,
    EmployerList,
    UpdateEmployerProfile,
    AddReview,
    ServiceList,
    ServiceDetail,
    RegisterUser,
    LoginUser,
    LogoutUser,
)

urlpatterns = [
    # Authentification
    path("api/auth/register/", RegisterUser.as_view(), name="register"),
    path("api/auth/login/", LoginUser.as_view(), name="login"),
    path("api/auth/logout/", LogoutUser.as_view(), name="logout"),
    # Rendez-vous
    path("api/appointments/", AppointmentList.as_view(), name="appointments_list"),
    path(
        "api/appointments/create/",
        CreateAppointment.as_view(),
        name="create_appointment",
    ),
    path(
        "api/appointments/<int:pk>/",
        AppointmentDetail.as_view(),
        name="appointment_detail",
    ),
    path("api/appointments/<int:pk>/review/", AddReview.as_view(), name="add_review"),
    # 🔹 Clients
    path("api/clients/", ClientList.as_view(), name="clients_list"),
    path("api/clients/me/", ClientProfile.as_view(), name="client_profile"),
    # Employeurs
    path("api/employers/", EmployerList.as_view(), name="employer_list"),
    path("api/employers/me/", UpdateEmployerProfile.as_view(), name="employer_profile"),
    # Services
    path("api/services/", ServiceList.as_view(), name="service_list"),
    path("api/services/<int:pk>/", ServiceDetail.as_view(), name="service_detail"),
]
