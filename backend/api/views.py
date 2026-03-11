from rest_framework import viewsets, views, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
from django.http import HttpResponse
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY
from .models import Service, GalleryImage, Package, BookingRequest, ClientShoot, Photographer, PhotographerSlot, SiteMedia
from .serializers import (
    ServiceSerializer,
    GalleryImageSerializer,
    PackageSerializer,
    BookingRequestSerializer,
    ClientShootSerializer,
    PhotographerSerializer,
    PhotographerSlotSerializer,
    SiteMediaSerializer
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
    def perform_create(self, serializer):
        from django.contrib.auth.models import User
        from django.utils import timezone
        
        # Determine client user based on authenticated session or create one
        client_user = None
        if self.request.user.is_authenticated:
            client_user = self.request.user
        else:
            email = serializer.validated_data.get('email')
            if email:
                client_user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email.split('@')[0],
                        'first_name': serializer.validated_data.get('first_name', ''),
                        'last_name': serializer.validated_data.get('last_name', ''),
                    }
                )

        # Auto-assign an available photographer if requested
        instance = serializer.save()
        if instance.shoot_date and instance.time_slot:
            # Try to find an available photographer slot
            slot = PhotographerSlot.objects.filter(
                date=instance.shoot_date,
                time_slot=instance.time_slot,
                is_booked=False,
                photographer__is_active=True
            ).first()

            if slot:
                slot.is_booked = True
                slot.save()
                instance.assigned_photographer = slot.photographer
                instance.status = 'confirmed' # Auto-confirm
                instance.save()
                
                # Automatically generate the ClientShoot so it appears in photographer portal
                if client_user:
                    ClientShoot.objects.create(
                        client=client_user,
                        property_address=instance.property_details[:300],
                        shoot_date=instance.shoot_date,
                        photographer=instance.assigned_photographer,
                        status='scheduled',
                        amount_due=instance.package_interest.price if instance.package_interest else None,
                        notes=f"Auto-generated from Booking #{instance.id}\nPackage: {instance.package_interest}\nContact: {instance.phone}"
                    )

                # SEND MOCKED EMAILS
                from .utils.email_utils import send_booking_created_emails
                phot_email = instance.assigned_photographer.user.email if instance.assigned_photographer and hasattr(instance.assigned_photographer, 'user') else None
                phot_name = instance.assigned_photographer.user.first_name if instance.assigned_photographer and hasattr(instance.assigned_photographer, 'user') else ""
                send_booking_created_emails(instance, instance.email, phot_email, phot_name)

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
                shoot_date=instance.shoot_date or timezone.now().date(),
                photographer=instance.assigned_photographer,
                status='scheduled',
                amount_due=instance.package_interest.price if instance.package_interest else None,
                notes=f"Auto-generated from Booking #{instance.id}\nPackage: {instance.package_interest}\nContact: {instance.phone}\nPhotographer: {instance.assigned_photographer}"
            )

            # SEND MOCKED EMAILS
            from .utils.email_utils import send_booking_created_emails
            phot_email = instance.assigned_photographer.user.email if instance.assigned_photographer and hasattr(instance.assigned_photographer, 'user') else None
            phot_name = instance.assigned_photographer.user.first_name if instance.assigned_photographer and hasattr(instance.assigned_photographer, 'user') else ""
            send_booking_created_emails(instance, instance.email, phot_email, phot_name)
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
            
        # Photographers see shoots assigned to them
        try:
            if hasattr(self.request.user, 'photographer_profile') and self.request.user.photographer_profile.is_active:
                return ClientShoot.objects.filter(photographer=self.request.user.photographer_profile).order_by('shoot_date')
        except Exception:
            pass
            
        # Standard clients see their own shoots
        return ClientShoot.objects.filter(client=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Attach the shoot to the requesting admin (or user) by default
        serializer.save(client=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        updated_instance = serializer.save()
        
        if old_status != 'delivered' and updated_instance.status == 'delivered':
            from .utils.email_utils import send_content_uploaded_emails
            send_content_uploaded_emails(updated_instance.property_address)

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
            
            # Mock Stripe for local development without actual API keys
            if getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_placeholder') == 'sk_test_placeholder':
                session_url = "https://checkout.stripe.com/pay/cs_test_mock123_please_add_real_key"
            else:
                    # Safely fallback to localhost if CORS origins are not explicitly defined in settings
                    base_url = settings.CORS_ALLOWED_ORIGINS[0] if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000"
                    
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
                        success_url=f"{base_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
                        cancel_url=f"{base_url}/dashboard?payment=cancelled",
                    )
                    session_url = session.url
            
            shoot.stripe_payment_link = session_url
            shoot.save()

            # SEND INVOICE EMAILS
            from .utils.email_utils import send_invoice_generated_email
            send_invoice_generated_email(shoot.property_address, session_url)
            
            return Response({
                "detail": "Invoice generated successfully",
                "stripe_payment_link": session_url
            })
            
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='verify-payment')
    def verify_payment(self, request):
        """
        Manually verifies a Stripe checkout session and updates the shoot's payment status.
        Helpful as a fallback when local webhooks cannot be reached.
        """
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({"detail": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if session_id.startswith('cs_test_mock'):
                return Response({"detail": "Mock session ignored"}, status=status.HTTP_200_OK)

            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == 'paid':
                shoot_id = session.get('metadata', {}).get('shoot_id')
                if shoot_id:
                    shoot = ClientShoot.objects.get(id=shoot_id)
                    shoot.payment_status = 'paid'
                    shoot.save()
                    
                    from .utils.email_utils import send_payment_confirmed_emails
                    from django.conf import settings
                    base_url = settings.CORS_ALLOWED_ORIGINS[0] if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000"
                    send_payment_confirmed_emails(shoot.property_address, f"{base_url}/dashboard")
                    return Response({"detail": "Payment verified", "status": "paid"})
            return Response({"detail": "Payment not completed"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='get-upload-url')
    def get_upload_url(self, request, pk=None):
        """
        Generates a direct-to-R2 presigned POST url
        """
        from .utils.r2_utils import generate_presigned_post
        import uuid
        
        shoot = self.get_object()
        
        # Only admins or the assigned photographer can upload
        is_admin = request.user.is_staff
        is_assigned_photographer = hasattr(request.user, 'photographer_profile') and shoot.photographer == request.user.photographer_profile
        
        if not (is_admin or is_assigned_photographer):
            return Response({"detail": "Not authorized to upload for this shoot."}, status=status.HTTP_403_FORBIDDEN)
            
        file_name = request.data.get('file_name', f"media_{uuid.uuid4().hex[:8]}.zip")
        file_type = request.data.get('file_type', 'application/zip')
        
        object_key = f"orders/shoot_{shoot.id}/{file_name}"
        
        presigned_data = generate_presigned_post(object_key, file_type, expires_in=3600)
        
        if presigned_data:
            return Response({
                "url": presigned_data['url'],
                "fields": presigned_data['fields'],
                "object_key": object_key
            })
        return Response({"detail": "Failed to generate presigned upload url."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='get-download-url')
    def get_download_url(self, request, pk=None):
        """
        Generates a 30-day presigned GET url for the client to download their media
        """
        from .utils.r2_utils import generate_presigned_url
        from django.utils import timezone
        import datetime
        
        shoot = self.get_object()
        
        # Must be the owner or admin
        if not (request.user.is_staff or shoot.client == request.user):
            return Response({"detail": "Not authorized to access this media."}, status=status.HTTP_403_FORBIDDEN)
            
        # Verify payment
        if shoot.payment_status != 'paid' and not request.user.is_staff:
            return Response({"detail": "Invoice must be paid before downloading."}, status=status.HTTP_402_PAYMENT_REQUIRED)
            
        # Verify 30-day window
        if not request.user.is_staff:
            thirty_days_ago = timezone.now().date() - datetime.timedelta(days=30)
            if shoot.shoot_date < thirty_days_ago:
                return Response({"detail": "Download link expired. Shoots are only available for 30 days."}, status=status.HTTP_410_GONE)

        if not shoot.r2_object_key:
             return Response({"detail": "Media has not been uploaded yet."}, status=status.HTTP_404_NOT_FOUND)
             
        # Generate 24 hour link (they can request it as many times as they want within the 30 days)
        presigned_url = generate_presigned_url(shoot.r2_object_key, expires_in=86400)
        
        if presigned_url:
            return Response({"download_url": presigned_url})
            
        return Response({"detail": "Failed to generate download url."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PhotographerSlotViewSet(viewsets.ModelViewSet):
    """
    API endpoint for photographers to manage their availability slots.
    """
    serializer_class = PhotographerSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins can see all slots, photographers only see theirs
        if self.request.user.is_staff:
            return PhotographerSlot.objects.all()
        try:
            photographer = self.request.user.photographer_profile
            return PhotographerSlot.objects.filter(photographer=photographer)
        except Exception:
            return PhotographerSlot.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_staff and 'photographer_id' in self.request.data:
            try:
                photographer = Photographer.objects.get(id=self.request.data['photographer_id'])
            except Photographer.DoesNotExist:
                pass # Fallback to below if not found or handled differently
        else:
            photographer = self.request.user.photographer_profile
            
        serializer.save(photographer=photographer)

class PhotographerViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows admins to view and manage photographers.
    """
    queryset = Photographer.objects.all().order_by('user__first_name')
    serializer_class = PhotographerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_staff:
            return Photographer.objects.none()
        return super().get_queryset()

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Public endpoint to list all active photographers for the team page."""
        photographers = Photographer.objects.filter(is_active=True).order_by('user__first_name')
        serializer = self.get_serializer(photographers, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        from django.contrib.auth.models import User
        from django.core.signing import TimestampSigner
        from .utils.email_utils import send_photographer_invite_email
        from django.conf import settings
        
        data = self.request.data
        email = data.get('email')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        # We can leave username blank since our EmailBackend allows email login, 
        # or generate a fallback username. We'll generate a fallback for DB unique constraints.
        base_username = data.get('username') or first_name.lower() + str(User.objects.count() + 1)
        
        # Create user but inactive with unusable password
        user = User.objects.create_user(
            username=base_username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=False
        )
        user.set_unusable_password()
        user.save()
        
        # Create photographer profile
        photographer = serializer.save(user=user)
        
        # Generate token
        signer = TimestampSigner()
        token = signer.sign_object({'user_id': user.id})
        
        # Determine frontend URL
        # For local dev, NextJS is usually on 3000
        frontend_url = 'http://localhost:3000' if settings.DEBUG else 'https://kcmedia-frontend.vercel.app'
        invite_link = f"{frontend_url}/photographer-signup?token={token}"
        
        # Send Email
        send_photographer_invite_email(
            email=email,
            name=first_name,
            invite_link=invite_link
        )
        
    def perform_destroy(self, instance):
        # Soft delete: mark as inactive to preserve history
        instance.is_active = False
        instance.save()
        # Also disable login
        instance.user.is_active = False
        instance.user.save()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='accept-invite')
    def accept_invite(self, request):
        from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
        from django.contrib.auth.models import User
        from rest_framework_simplejwt.tokens import RefreshToken
        
        token = request.data.get('token')
        password = request.data.get('password')
        
        if not token or not password:
            return Response({"detail": "Token and password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        signer = TimestampSigner()
        try:
            # Token expires in 7 days (604800 seconds)
            token_data = signer.unsign_object(token, max_age=604800)
            user_id = token_data.get('user_id')
            user = User.objects.get(id=user_id)
            
            # Set password and activate
            user.set_password(password)
            user.is_active = True
            user.save()
            
            # Since they are active now, return JWT tokens to log them in automatically
            refresh = RefreshToken.for_user(user)
            return Response({
                'detail': 'Account activated and password set successfully.',
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_200_OK)
            
        except SignatureExpired:
            return Response({"detail": "Invitation link has expired."}, status=status.HTTP_400_BAD_REQUEST)
        except BadSignature:
            return Response({"detail": "Invalid invitation link."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": "An error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new Client user account and return JWT tokens.
    """
    data = request.data
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')

    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
        return Response({'detail': 'An account with that email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(
            username=email, # Use email as username
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_availability(request):
    """
    Returns available time slots grouped by date.
    Finds dates/times that have at least one unbooked photographer.
    """
    import datetime
    from django.utils import timezone
    
    start_date_str = request.GET.get('start_date')
    if start_date_str:
        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
    else:
        start_date = timezone.now().date()
        
    end_date = start_date + datetime.timedelta(days=30)
    
    # Get all unbooked slots in the next 30 days
    slots = PhotographerSlot.objects.filter(
        date__gte=start_date,
        date__lte=end_date,
        is_booked=False,
        photographer__is_active=True
    ).values('date', 'time_slot').distinct().order_by('date', 'time_slot')
    
    availability = {}
    for slot in slots:
        date_str = slot['date'].strftime('%Y-%m-%d')
        if date_str not in availability:
            availability[date_str] = []
        availability[date_str].append(slot['time_slot'])
        
    return Response(availability)


class CurrentUserView(views.APIView):
    """
    API endpoint to fetch the currently authenticated user's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_photo = False
        photo_id = None
        photo_url = None
        try:
            if hasattr(request.user, 'photographer_profile') and request.user.photographer_profile.is_active:
                is_photo = True
                photo_id = request.user.photographer_profile.id
                photo_url = request.user.photographer_profile.profile_image_url
        except Exception:
            pass
            
        serializer = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_staff': request.user.is_staff,
            'is_photographer': is_photo,
            'photographer_id': photo_id,
            'profile_image_url': photo_url
        }
        return Response(serializer)

    def patch(self, request):
        user = request.user
        data = request.data
        
        # Update Base User fields
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        user.save()

        # Update Photographer Profile
        if hasattr(user, 'photographer_profile'):
            if 'profile_image_url' in data:
                user.photographer_profile.profile_image_url = data['profile_image_url']
            if 'bio' in data:
                user.photographer_profile.bio = data['bio']
            if 'phone' in data:
                user.photographer_profile.phone = data['phone']
            user.photographer_profile.save()

        return self.get(request)

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
                
                from .utils.email_utils import send_payment_confirmed_emails
                from django.conf import settings
                base_url = settings.CORS_ALLOWED_ORIGINS[0] if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000"
                send_payment_confirmed_emails(shoot.property_address, f"{base_url}/dashboard")
            except ClientShoot.DoesNotExist:
                pass

    return HttpResponse(status=200)

class SiteMediaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and editing dynamic site media URLs.
    Public can GET. Admins can POST/PUT/PATCH/DELETE.
    """
    queryset = SiteMedia.objects.all().order_by('id')
    serializer_class = SiteMediaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'key'

    def list(self, request, *args, **kwargs):
        # Allow returning as a dict of {key: url} for optimal frontend consumption
        queryset = self.get_queryset()
        if request.query_params.get('format') == 'dict':
            return Response({item.key: item.url for item in queryset})
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can modify site media")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can modify site media")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can modify site media")
        instance.delete()
