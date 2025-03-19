from django.contrib import admin
from .models import Client, Employer, Service, Appointment

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "created_at")
    search_fields = ("name", "email")

@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "service", "is_active", "created_at")
    search_fields = ("name", "email")
    list_filter = ("service", "is_active")

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description")
    search_fields = ("name",)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "employer", "service", "date", "status", "payment_method", "total_amount")
    search_fields = ("client__name", "employer__name")
    list_filter = ("status", "payment_method", "service", "date")

