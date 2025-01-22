from django.urls import path
from .views import (
    AppointmentList, CreateAppointment, ClientList,
    EmployerList, ClientProfile, UpdateEmployerProfile,
    AddReview
)

urlpatterns = [
    path('list/', AppointmentList.as_view(), name='appointments_list'),
    path('create/', CreateAppointment.as_view(), name='create_appointment'),
    path('clients/', ClientList.as_view(), name='client_list'),
    path('clients/me/', ClientProfile.as_view(), name='client_profile'),
    path('employers/', EmployerList.as_view(), name='employer_list'),
    path('employers/update/', UpdateEmployerProfile.as_view(), name='update_employer_profile'),
    path('review/', AddReview.as_view(), name='add_review'),
]
