"""
URL configuration for pokemon_inventory_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    # Django admin site
    path('admin/', admin.site.urls),
    
    # API endpoints (handled by inventory app)
    path('api/', include('inventory.urls')),
    
    # DRF browsable API authentication
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]

# Serve media files during development
# In production, these should be served by a web server or S3
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all: serve React frontend for any non-API route
urlpatterns += [
    re_path(r'^(?!api/|admin/|static/).*$', TemplateView.as_view(template_name='index.html')),
]
