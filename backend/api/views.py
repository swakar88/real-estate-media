from rest_framework import viewsets, views, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.conf import settings
from django.http import HttpResponse
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY
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

class ClientShootViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows clients to view their shoots, and admins to manage them.
    """
    queryset = ClientShoot.objects.all().order_by('-created_at')
    serializer_class = ClientShootSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return ClientShoot.objects.all().order_by('-created_at')
        return ClientShoot.objects.filter(client=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='generate-invoice')
    def generate_invoice(self, request, pk=None):
        shoot = self.get_object()
        
        if not request.user.is_staff:
            return Response({"detail": "Only admins can generate invoices."}, status=status.HTTP_403_FORBIDDEN)
            
        amount_due = request.data.get('amount_due')
        if not amount_due:
            return Response({"detail": "amount_due is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Update the shoot amount
            shoot.amount_due = amount_due
            shoot.save()
            
            # Create Stripe Checkout Session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Real Estate Media Services: {shoot.property_address}',
                            'description': 'Photography & Media Package',
                        },
                        'unit_amount': int(float(amount_due) * 100), # Stripe expects cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                metadata={'shoot_id': shoot.id},
                # In a real app we'd redirect to a success/cancel page on the frontend
                success_url=f"{settings.CORS_ALLOWED_ORIGINS[0]}/dashboard?payment=success" if settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000/dashboard?payment=success",
                cancel_url=f"{settings.CORS_ALLOWED_ORIGINS[0]}/dashboard?payment=cancelled" if settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000/dashboard?payment=cancelled",
            )
            
            shoot.stripe_payment_link = session.url
            shoot.save()
            
            return Response({
                "detail": "Invoice generated successfully",
                "stripe_payment_link": session.url
            })
            
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """
    Webhook endpoint for Stripe to notify us when a payment succeeds.
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    event = None

    try:
        # Verify webhook signature using the raw body
        event = stripe.Webhook.construct_event(
            payload, sig_header, getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
        )
    except ValueError as e:
        # Invalid payload
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return HttpResponse(status=400)
    except Exception as e:
        return HttpResponse(content=str(e), status=400)

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # We stored the shoot_id in the metadata when creating the session
        shoot_id = session.get('metadata', {}).get('shoot_id')
        
        if shoot_id:
            try:
                shoot = ClientShoot.objects.get(id=shoot_id)
                shoot.payment_status = 'paid'
                shoot.save()
            except ClientShoot.DoesNotExist:
                pass

    return HttpResponse(status=200)
