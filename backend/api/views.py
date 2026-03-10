from rest_framework import viewsets, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import Service, GalleryImage, Package, BookingRequest, ClientShoot
from .serializers import (
    ServiceSerializer,
    GalleryImageSerializer,
    PackageSerializer,
    BookingRequestSerializer,
    ClientShootSerializer
)

class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows services to be viewed.
    """
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer

class GalleryImageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows gallery images to be viewed.
    """
    queryset = GalleryImage.objects.all().order_by('-created_at')
    serializer_class = GalleryImageSerializer

    # Optional: We could use django-filter here instead, but basic list filtering suffices
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

class PackageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows packages to be viewed.
    """
    queryset = Package.objects.all().order_by('order', 'price')
    serializer_class = PackageSerializer

class BookingRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint for submitting booking requests.
    """
    queryset = BookingRequest.objects.all().order_by('-created_at')
    serializer_class = BookingRequestSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()] # Public can create
        return [IsAuthenticated()] # Only admin can view/edit

    def perform_update(self, serializer):
        # Check if the status is changing to 'confirmed'
        instance = self.get_object()
        new_status = serializer.validated_data.get('status', instance.status)
        
        # If transitioning to confirmed
        if instance.status != 'confirmed' and new_status == 'confirmed':
            super().perform_update(serializer)
            
            # The user requested skipping full account creation/emailing for now,
            # but ClientShoot requires a User foreign key.
            # We will create a dormant User account for the client so the database constraint passes.
            client_user, created = User.objects.get_or_create(
                email=instance.email,
                defaults={
                    'username': instance.email.split('@')[0] + str(instance.id),
                    'first_name': instance.first_name,
                    'last_name': instance.last_name,
                }
            )
            if created:
                client_user.set_unusable_password()
                client_user.save()
            
            # Extract date from property details or use a placeholder
            from django.utils import timezone
            
            # Create the ClientShoot
            ClientShoot.objects.create(
                client=client_user,
                property_address=instance.property_details[:300], # Trucate safely
                shoot_date=timezone.now().date(), # Default to today, admin can edit later
                status='editing',
                notes=f"Auto-generated from Booking #{instance.id}\nPackage: {instance.package_interest}\nContact: {instance.phone}"
            )
        else:
            super().perform_update(serializer)

class ClientShootViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows clients to view their shoots.
    """
    serializer_class = ClientShootSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return shoots belonging to the currently logged in user
        return ClientShoot.objects.filter(client=self.request.user).order_by('-created_at')

class CurrentUserView(views.APIView):
    """
    API endpoint to fetch the currently authenticated user's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_staff': request.user.is_staff,
        }
        return Response(serializer)
