from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("appointments.urls")),  # Assure-toi que tout passe bien par /api/
]
