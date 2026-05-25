# appointments/urls.py
from django.urls import path

from .views import (
    AddReview,
    AppointmentAcceptView,
    AppointmentCancelView,
    AppointmentDetail,
    AppointmentList,
    AppointmentPayment,
    AppointmentRefuseView,
    AppointmentReview,
    ChangePasswordView,
    ClientProfile,
    ContactRequestCreate,
    ConversationListCreate,
    CreateAppointment,
    CreateClientProfile,
    CreateEmployerProfile,
    EmployerAvailability,
    EmployerList,
    EmployerProfile,
    EmployerUpdate,
    FavoriteEmployerDetail,
    FavoriteEmployerListCreate,
    FavoriteServiceDetail,
    FavoriteServiceListCreate,
    LoginView,
    LogoutView,
    MarkConversationReadView,
    MarkNotificationRead,
    MessageListCreate,
    MyProfilesView,
    NotificationList,
    ProcessPayment,
    RegisterView,
    ReviewListCreateView,
    SearchView,
    ServiceDetail,
    ServiceList,
    UserProfile,
)

app_name = "appointments"

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/user/", UserProfile.as_view(), name="user_profile"),
    path("auth/profiles/", MyProfilesView.as_view(), name="my_profiles"),
    path("users/change-password/", ChangePasswordView.as_view(), name="change_password"),

    path("services/", ServiceList.as_view(), name="service_list"),
    path("services/<int:pk>/", ServiceDetail.as_view(), name="service_detail"),
    path("search/", SearchView.as_view(), name="search"),

    path("clients/profile/", ClientProfile.as_view(), name="client_profile"),
    path("clients/profile/create/", CreateClientProfile.as_view(), name="create_client_profile"),
    path("employers/", EmployerList.as_view(), name="employer_list"),
    path("employers/profile/", EmployerProfile.as_view(), name="employer_profile"),
    path("employers/update/", EmployerUpdate.as_view(), name="employer_update"),
    path("employers/profile/create/", CreateEmployerProfile.as_view(), name="create_employer_profile"),
    path("employers/<int:employer_id>/availabilities/", EmployerAvailability.as_view(), name="employer_availability"),

    path("appointments/", AppointmentList.as_view(), name="appointment_list"),
    path("appointments/create/", CreateAppointment.as_view(), name="create_appointment"),
    path("appointments/<int:pk>/", AppointmentDetail.as_view(), name="appointment_detail"),
    path("appointments/<int:pk>/cancel/", AppointmentCancelView.as_view(), name="appointment_cancel"),
    path("appointments/<int:pk>/accept/", AppointmentAcceptView.as_view(), name="appointment_accept"),
    path("appointments/<int:pk>/refuse/", AppointmentRefuseView.as_view(), name="appointment_refuse"),
    path("appointments/<int:pk>/review/", AppointmentReview.as_view(), name="appointment_review"),
    path("appointments/<int:pk>/add-review/", AddReview.as_view(), name="appointment_add_review"),
    path("appointments/<int:pk>/payment/", AppointmentPayment.as_view(), name="appointment_payment"),

    path("reviews/", ReviewListCreateView.as_view(), name="review_list_create"),

    path("favorites/services/", FavoriteServiceListCreate.as_view(), name="favorite_service_list_create"),
    path("favorites/services/<int:pk>/", FavoriteServiceDetail.as_view(), name="favorite_service_detail"),
    path("favorites/employers/", FavoriteEmployerListCreate.as_view(), name="favorite_employer_list_create"),
    path("favorites/employers/<int:pk>/", FavoriteEmployerDetail.as_view(), name="favorite_employer_detail"),

    path("conversations/", ConversationListCreate.as_view(), name="conversation_list_create"),
    path("messages/", MessageListCreate.as_view(), name="message_list_create"),
    path("messages/mark-read/", MarkConversationReadView.as_view(), name="message_mark_read"),

    path("contact-requests/", ContactRequestCreate.as_view(), name="contact_request_create"),
    path("contact/", ContactRequestCreate.as_view(), name="contact_create"),

    path("notifications/", NotificationList.as_view(), name="notification_list"),
    path("notifications/<int:notification_id>/read/", MarkNotificationRead.as_view(), name="mark_notification_read"),

    path("payments/<int:appointment_id>/process/", ProcessPayment.as_view(), name="process_payment"),
]