from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils import timezone

from .models import (
    Appointment,
    Availability,
    Client,
    ContactRequest,
    Conversation,
    Employer,
    FavoriteEmployer,
    FavoriteService,
    Message,
    Notification,
    Review,
    Service,
    User,
)


# ---------- Inlines ----------

class ClientInline(admin.StackedInline):
    model = Client
    extra = 0
    can_delete = True
    fields = (
        "name",
        "email",
        "phone",
        "address",
        "city",
        "is_active",
        "profile_picture",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at")
    show_change_link = True


class EmployerInline(admin.StackedInline):
    model = Employer
    extra = 0
    can_delete = True
    fields = (
        "name",
        "email",
        "phone",
        "service",
        "description",
        "city",
        "address",
        "hourly_rate",
        "is_active",
        "is_verified",
        "average_rating",
        "total_reviews",
        "profile_picture",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("average_rating", "total_reviews", "created_at", "updated_at")
    show_change_link = True


# ---------- User ----------

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "has_client_profile",
        "has_employer_profile",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = (
        "role",
        "is_staff",
        "is_superuser",
        "is_active",
        "date_joined",
    )
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    ordering = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login")

    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Informations Nazek",
            {
                "fields": (
                    "role",
                    "phone",
                    "address",
                    "profile_picture",
                )
            },
        ),
    )

    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        (
            "Informations Nazek",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "role",
                    "phone",
                    "address",
                )
            },
        ),
    )

    inlines = (ClientInline, EmployerInline)

    @admin.display(boolean=True, description="Profil client")
    def has_client_profile(self, obj):
        return hasattr(obj, "client")

    @admin.display(boolean=True, description="Profil prestataire")
    def has_employer_profile(self, obj):
        return hasattr(obj, "employer")


# ---------- Service ----------

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active", "slug", "created_at", "updated_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "description", "slug")
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")


# ---------- Client ----------

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "email",
        "phone",
        "city",
        "is_active",
        "user",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_active", "city", "created_at")
    search_fields = ("name", "email", "phone", "city", "address", "user__username", "user__email")
    autocomplete_fields = ("user",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")


# ---------- Employer ----------

@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "email",
        "phone",
        "service",
        "city",
        "is_active",
        "is_verified",
        "average_rating",
        "total_reviews",
        "hourly_rate",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "is_active",
        "is_verified",
        "service",
        "city",
        "created_at",
    )
    search_fields = (
        "name",
        "email",
        "phone",
        "description",
        "city",
        "address",
        "user__username",
        "user__email",
    )
    autocomplete_fields = ("user", "service")
    ordering = ("-is_verified", "-average_rating", "name")
    readonly_fields = ("average_rating", "total_reviews", "created_at", "updated_at")


# ---------- Availability ----------

@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employer",
        "day_of_week",
        "start_time",
        "end_time",
        "is_available",
    )
    list_filter = ("day_of_week", "is_available", "employer__service")
    search_fields = ("employer__name", "employer__email")
    autocomplete_fields = ("employer",)
    ordering = ("employer", "day_of_week", "start_time")


# ---------- Appointment ----------

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
        "canceled_at",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "status",
        "payment_method",
        "is_paid",
        "service",
        "employer__is_verified",
        "date",
        "created_at",
    )
    search_fields = (
        "client__name",
        "client__email",
        "employer__name",
        "employer__email",
        "service__name",
        "description",
        "location",
        "cancel_reason",
    )
    autocomplete_fields = ("client", "employer", "service")
    ordering = ("-date",)
    readonly_fields = ("created_at", "updated_at", "canceled_at")
    actions = ("mark_confirmed", "mark_refused", "mark_completed", "mark_canceled")

    @admin.action(description="Marquer comme Accepté")
    def mark_confirmed(self, request, queryset):
        queryset.update(status=Appointment.Status.ACCEPTED)

    @admin.action(description="Marquer comme Refusé")
    def mark_refused(self, request, queryset):
        queryset.update(status=Appointment.Status.REFUSED)

    @admin.action(description="Marquer comme Terminé")
    def mark_completed(self, request, queryset):
        queryset.update(status=Appointment.Status.COMPLETED)

    @admin.action(description="Marquer comme Annulé")
    def mark_canceled(self, request, queryset):
        queryset.update(status=Appointment.Status.CANCELED)


# ---------- Review ----------

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "appointment",
        "client",
        "employer",
        "rating",
        "is_published",
        "created_at",
        "updated_at",
    )
    list_filter = ("rating", "is_published", "created_at", "employer__service")
    search_fields = (
        "client__name",
        "client__email",
        "employer__name",
        "employer__email",
        "comment",
    )
    autocomplete_fields = ("appointment", "client", "employer")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")


# ---------- Favorites ----------

@admin.register(FavoriteService)
class FavoriteServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "service", "created_at")
    list_filter = ("service", "created_at")
    search_fields = ("client__name", "client__email", "service__name")
    autocomplete_fields = ("client", "service")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)


@admin.register(FavoriteEmployer)
class FavoriteEmployerAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "employer", "created_at")
    list_filter = ("employer__service", "created_at")
    search_fields = ("client__name", "client__email", "employer__name", "employer__email")
    autocomplete_fields = ("client", "employer")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)


# ---------- Messaging ----------

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("sender_user", "sender_type", "content", "is_read", "read_at", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "employer", "is_active", "created_at", "updated_at")
    list_filter = ("is_active", "created_at", "employer__service")
    search_fields = (
        "client__name",
        "client__email",
        "employer__name",
        "employer__email",
    )
    autocomplete_fields = ("client", "employer")
    ordering = ("-updated_at",)
    readonly_fields = ("created_at", "updated_at")
    inlines = (MessageInline,)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "conversation",
        "sender_user",
        "sender_type",
        "is_read",
        "read_at",
        "created_at",
    )
    list_filter = ("sender_type", "is_read", "created_at")
    search_fields = (
        "conversation__client__name",
        "conversation__employer__name",
        "sender_user__username",
        "sender_user__email",
        "content",
    )
    autocomplete_fields = ("conversation", "sender_user")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)


# ---------- Contact / Support ----------

@admin.register(ContactRequest)
class ContactRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "subject",
        "email",
        "status",
        "user",
        "created_at",
        "updated_at",
        "resolved_at",
    )
    list_filter = ("status", "created_at", "resolved_at")
    search_fields = ("subject", "email", "full_name", "message", "user__username", "user__email")
    autocomplete_fields = ("user",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "resolved_at")
    actions = ("mark_in_progress", "mark_closed")

    @admin.action(description="Marquer en cours")
    def mark_in_progress(self, request, queryset):
        queryset.update(status=ContactRequest.Status.IN_PROGRESS)

    @admin.action(description="Marquer fermé")
    def mark_closed(self, request, queryset):
        now = timezone.now()
        queryset.update(status=ContactRequest.Status.CLOSED, resolved_at=now)


# ---------- Notifications ----------

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "recipient",
        "notification_type",
        "title",
        "is_read",
        "appointment",
        "created_at",
    )
    list_filter = ("is_read", "notification_type", "created_at")
    search_fields = ("recipient__username", "recipient__email", "title", "message")
    autocomplete_fields = ("recipient", "appointment")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)