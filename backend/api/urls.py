from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'services', views.ServiceViewSet)
router.register(r'gallery', views.GalleryImageViewSet)
router.register(r'packages', views.PackageViewSet)
router.register(r'bookings', views.BookingRequestViewSet)
router.register(r'shoots', views.ClientShootViewSet, basename='shoots')

urlpatterns = [
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    path('', include(router.urls)),
]
