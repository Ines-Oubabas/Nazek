from django.contrib import admin
from .models import Service, Employer, Client, Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('client', 'employer', 'service', 'date', 'status', 'payment_method', 'total_amount')
    search_fields = ('client__name', 'employer__name', 'service__name', 'description')
    list_filter = ('status', 'payment_method', 'date', 'service')
    ordering = ('-date',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name',)

@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'service')
    search_fields = ('name', 'email', 'service__name')
    list_filter = ('service',)

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone')
    search_fields = ('name', 'email')
