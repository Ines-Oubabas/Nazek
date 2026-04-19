# nazek/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# ✅ Admin Django plus propre (optionnel)
admin.site.site_header = "Nazek Admin"
admin.site.site_title = "Nazek Admin"
admin.site.index_title = "Tableau de bord"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("appointments.urls")),
]

# ✅ En DEV seulement: servir les fichiers MEDIA (images upload)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)