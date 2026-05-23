from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfile,
    AppointmentList,
    CreateAppointment,
    AppointmentDetail,
    AppointmentReview,
    AppointmentPayment,
    AddReview,
    ClientProfile,
    EmployerList,
    EmployerProfile,
    EmployerUpdate,
    EmployerAvailability,
    ServiceList,
    ServiceDetail,
    NotificationList,
    MarkNotificationRead,
    ProcessPayment,
)

app_name = "appointments"

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/user/", UserProfile.as_view(), name="user_profile"),

    # Services
    path("services/", ServiceList.as_view(), name="service_list"),
    path("services/<int:pk>/", ServiceDetail.as_view(), name="service_detail"),

    # Profiles
    path("clients/profile/", ClientProfile.as_view(), name="client_profile"),
    path("employers/", EmployerList.as_view(), name="employer_list"),
    path("employers/profile/", EmployerProfile.as_view(), name="employer_profile"),
    path("employers/update/", EmployerUpdate.as_view(), name="employer_update"),
    path("employers/<int:employer_id>/availabilities/", EmployerAvailability.as_view(), name="employer_availability"),

    # Appointments
    path("appointments/", AppointmentList.as_view(), name="appointment_list"),
    path("appointments/create/", CreateAppointment.as_view(), name="create_appointment"),
    path("appointments/<int:pk>/", AppointmentDetail.as_view(), name="appointment_detail"),
    path("appointments/<int:pk>/review/", AppointmentReview.as_view(), name="appointment_review"),
    path("appointments/<int:pk>/add-review/", AddReview.as_view(), name="appointment_add_review"),
    path("appointments/<int:pk>/payment/", AppointmentPayment.as_view(), name="appointment_payment"),

    # Notifications
    path("notifications/", NotificationList.as_view(), name="notification_list"),
    path("notifications/<int:notification_id>/read/", MarkNotificationRead.as_view(), name="mark_notification_read"),

    # Payments
    path("payments/<int:appointment_id>/process/", ProcessPayment.as_view(), name="process_payment"),
]