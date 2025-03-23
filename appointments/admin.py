from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Client, Employer, Service, Appointment, Availability, Notification, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("id", "username", "email", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("username", "email")
    ordering = ("id",)
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Informations personnelles", {
            "fields": ("first_name", "last_name", "email", "phone", "address", "profile_picture", "role")
        }),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")
        }),
        ("Dates importantes", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2", "role", "is_staff", "is_active"),
        }),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "created_at")
    search_fields = ("name", "email")
    readonly_fields = ("created_at",)


@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "service", "is_active", "created_at", "average_rating", "total_reviews")
    search_fields = ("name", "email")
    list_filter = ("service", "is_active", "is_verified")
    readonly_fields = ("created_at", "average_rating", "total_reviews")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description", "is_active")
    search_fields = ("name",)
    list_filter = ("is_active",)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "id", "client", "employer", "service", "date", "status",
        "payment_method", "total_amount", "is_paid"
    )
    search_fields = ("client__name", "employer__name")
    list_filter = ("status", "payment_method", "service", "date")
    readonly_fields = ("created_at",)


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ("id", "employer", "day_of_week", "start_time", "end_time", "is_available")
    list_filter = ("day_of_week", "is_available")
    search_fields = ("employer__name",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "title", "notification_type", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("recipient__username", "title")
    readonly_fields = ("created_at",)
