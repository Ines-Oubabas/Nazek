from django.contrib import admin
from django.urls import path, include  # Ajout de include
from django.http import HttpResponseRedirect

urlpatterns = [
    path('', lambda request: HttpResponseRedirect('/appointments/list/')),
    path('admin/', admin.site.urls),  # URL pour l'administration Django
    path('appointments/', include('appointments.urls')),  # URL pour l'application appointments
]
