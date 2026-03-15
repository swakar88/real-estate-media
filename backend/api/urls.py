from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'services', views.ServiceViewSet)
router.register(r'gallery', views.GalleryImageViewSet)
router.register(r'packages', views.PackageViewSet)
router.register(r'bookings', views.BookingRequestViewSet)
router.register(r'shoots', views.ClientShootViewSet, basename='shoots')
router.register(r'photographers', views.PhotographerViewSet, basename='photographers')
router.register(r'photographer/slots', views.PhotographerSlotViewSet, basename='photographer-slots')
router.register(r'site-media', views.SiteMediaViewSet, basename='site-media')
router.register(r'clients', views.ClientViewSet, basename='clients')
router.register(r'email-configuration', views.EmailConfigurationViewSet, basename='email-configuration')
router.register(r'email-templates', views.EmailTemplateViewSet, basename='email-templates')

urlpatterns = [
    path('availability/', views.get_availability, name='get_availability'),
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    path('register/', views.register_user, name='register_user'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe-webhook'),
    path('', include(router.urls)),
]
