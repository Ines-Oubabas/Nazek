# appointments/urls.py
"""
URLs de l'app "appointments" (API).
⚠️ Ce fichier doit être inclus dans le projet avec un prefix type: path("api/v1/", include("appointments.urls"))
"""

from django.urls import path

from .views import (
    # Auth
    RegisterView,
    LoginView,
    LogoutView,
    UserProfile,
    # Appointments
    AppointmentList,
    CreateAppointment,
    AppointmentDetail,
    AppointmentReview,
    AppointmentPayment,
    AddReview,
    # Profiles
    ClientProfile,
    EmployerList,
    EmployerProfile,
    EmployerUpdate,
    EmployerAvailability,
    # Services
    ServiceList,
    ServiceDetail,
    # Notifications
    NotificationList,
    MarkNotificationRead,
    # Payments
    ProcessPayment,
)

app_name = "appointments"

urlpatterns = [
    # 🔐 Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/user/", UserProfile.as_view(), name="user_profile"),

    # 📅 Appointments
    path("appointments/", AppointmentList.as_view(), name="appointment_list"),
    path("appointments/create/", CreateAppointment.as_view(), name="create_appointment"),
    path("appointments/<int:pk>/", AppointmentDetail.as_view(), name="appointment_detail"),
    path("appointments/<int:pk>/review/", AppointmentReview.as_view(), name="appointment_review"),
    path("appointments/<int:pk>/payment/", AppointmentPayment.as_view(), name="appointment_payment"),
    path("appointments/<int:appointment_id>/review/", AppointmentReview.as_view(), name="appointment_review"),

    # 👤 Client
    path("clients/profile/", ClientProfile.as_view(), name="client_profile"),

    # 👷 Employer
    path("employers/", EmployerList.as_view(), name="employer_list"),
    path("employers/profile/", EmployerProfile.as_view(), name="employer_profile"),
    path("employers/update/", EmployerUpdate.as_view(), name="employer_update"),
    path("employers/<int:employer_id>/availabilities/", EmployerAvailability.as_view(), name="employer_availability"),

    # 🛠️ Services
    path("services/", ServiceList.as_view(), name="service_list"),
    path("services/<int:pk>/", ServiceDetail.as_view(), name="service_detail"),

    # 🔔 Notifications
    path("notifications/", NotificationList.as_view(), name="notification_list"),
    path("notifications/<int:notification_id>/read/", MarkNotificationRead.as_view(), name="mark_notification_read"),

    # 💳 Payments
    path("payments/<int:appointment_id>/process/", ProcessPayment.as_view(), name="process_payment"),
]