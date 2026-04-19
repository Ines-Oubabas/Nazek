# appointments/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import Client, Employer, Service, Appointment, Availability, Notification, User


# ----------------------------
# 🔧 Admin branding (optionnel)
# ----------------------------
admin.site.site_header = "Nazek - Administration"
admin.site.site_title = "Nazek Admin"
admin.site.index_title = "Tableau de bord"


# ----------------------------
# ✅ Inlines
# ----------------------------
class AvailabilityInline(admin.TabularInline):
    model = Availability
    extra = 0
    fields = ("day_of_week", "start_time", "end_time", "is_available")
    ordering = ("day_of_week", "start_time")
    show_change_link = True


# ----------------------------
# 👤 USER
# ----------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("id", "username", "email", "role", "is_active", "is_staff", "is_superuser")
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("id",)
    list_per_page = 25

    # Permet l'autocomplétion dans les champs ManyToMany (groups/permissions)
    filter_horizontal = ("groups", "user_permissions")

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Informations personnelles",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "phone",
                    "address",
                    "profile_picture",
                    "role",
                )
            },
        ),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Dates importantes", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "password1", "password2", "role", "is_staff", "is_active"),
            },
        ),
    )


# ----------------------------
# 🧑 CLIENT
# ----------------------------
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "user", "created_at")
    search_fields = ("name", "email", "phone", "user__username", "user__email")
    list_filter = ("created_at",)
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user",)
    list_per_page = 25


# ----------------------------
# 👷 EMPLOYER
# ----------------------------
@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "email",
        "phone",
        "service",
        "is_active",
        "is_verified",
        "avg_rating",
        "reviews_count",
        "created_at",
    )
    search_fields = ("name", "email", "phone", "user__username", "user__email", "service__name")
    list_filter = ("service", "is_active", "is_verified", "created_at")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user", "service")
    inlines = [AvailabilityInline]
    list_per_page = 25

    @admin.display(description="Note moyenne", ordering="average_rating")
    def avg_rating(self, obj):
        # safe: si le champ/propriété n'existe pas -> "-"
        val = getattr(obj, "average_rating", None)
        return "-" if val is None else round(float(val), 2)

    @admin.display(description="Nb avis", ordering="total_reviews")
    def reviews_count(self, obj):
        val = getattr(obj, "total_reviews", None)
        return "-" if val is None else int(val)


# ----------------------------
# 🛠️ SERVICE
# ----------------------------
@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active")
    search_fields = ("name",)
    list_filter = ("is_active",)
    list_per_page = 25


# ----------------------------
# 📅 APPOINTMENT
# ----------------------------
@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "date",
        "status",
        "client",
        "employer",
        "service",
        "payment_method",
        "is_paid",
        "total_amount",
        "created_at",
    )
    search_fields = (
        "client__name",
        "client__email",
        "employer__name",
        "employer__email",
        "service__name",
    )
    list_filter = ("status", "payment_method", "is_paid", "service", "date", "created_at")
    readonly_fields = ("created_at",)
    date_hierarchy = "date"
    list_select_related = ("client", "employer", "service")
    autocomplete_fields = ("client", "employer", "service")
    list_per_page = 25

    actions = ["mark_paid", "mark_unpaid"]

    @admin.action(description="Marquer comme payé")
    def mark_paid(self, request, queryset):
        queryset.update(is_paid=True)

    @admin.action(description="Marquer comme non payé")
    def mark_unpaid(self, request, queryset):
        queryset.update(is_paid=False)


# ----------------------------
# 🕒 AVAILABILITY
# ----------------------------
@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ("id", "employer", "day_of_week", "start_time", "end_time", "is_available")
    list_filter = ("day_of_week", "is_available")
    search_fields = ("employer__name", "employer__email", "employer__user__email")
    autocomplete_fields = ("employer",)
    list_select_related = ("employer",)
    list_per_page = 25


# ----------------------------
# 🔔 NOTIFICATION
# ----------------------------
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "notification_type", "title", "is_read", "created_at")
    list_filter = ("notification_type", "is_read", "created_at")
    search_fields = ("recipient__username", "recipient__email", "title", "message")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"
    autocomplete_fields = ("recipient", "appointment")
    list_select_related = ("recipient", "appointment")
    list_per_page = 25

    actions = ["mark_read", "mark_unread"]

    @admin.action(description="Marquer comme lue")
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Marquer comme non lue")
    def mark_unread(self, request, queryset):
        queryset.update(is_read=False)