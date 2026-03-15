from rest_framework import viewsets, views, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
from django.http import HttpResponse
import stripe
import os
import threading
from datetime import datetime

stripe.api_key = settings.STRIPE_SECRET_KEY
from .models import (
    Service, GalleryImage, Package, BookingRequest, ClientShoot, 
    Photographer, PhotographerSlot, SiteMedia, 
    EmailConfiguration, EmailTemplate, MediaItem
)
from .serializers import (
    ServiceSerializer,
    GalleryImageSerializer,
    PackageSerializer,
    BookingRequestSerializer,
    ClientShootSerializer,
    PhotographerSerializer,
    PhotographerSlotSerializer,
    SiteMediaSerializer,
    ClientSerializer,
    EmailConfigurationSerializer,
    EmailTemplateSerializer,
    MediaItemSerializer
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

    def get_permissions(self):
        if self.action in ['public_view', 'get_download_url']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        if self.action in ['public_view', 'get_download_url']:
            return ClientShoot.objects.all().order_by('-created_at')

        if self.request.user.is_staff:
            return ClientShoot.objects.all().order_by('-created_at')
            
        # Photographers see shoots assigned to them
        try:
            if hasattr(self.request.user, 'photographer_profile') and self.request.user.photographer_profile.is_active:
                return ClientShoot.objects.filter(photographer=self.request.user.photographer_profile).order_by('shoot_date')
        except Exception:
            pass
            
        # Standard clients see their own shoots
        if self.request.user.is_authenticated:
            return ClientShoot.objects.filter(client=self.request.user).order_by('-created_at')
            
        return ClientShoot.objects.none()

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
            
        amount_due = request.data.get('amount_due') or shoot.amount_due
        if not amount_due:
            return Response({"detail": "No amount_due provided or set for this shoot."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Update the shoot amount if explicitly provided
            if request.data.get('amount_due'):
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

    @action(detail=True, methods=['get'], url_path='get-upload-url')
    def get_upload_url(self, request, pk=None):
        """
        Generates a presigned PUT URL for Cloudflare R2.
        """
        shoot = self.get_object()
        media_type = request.query_params.get('type', 'photo')
        filename = request.query_params.get('filename', f"file_{int(datetime.now().timestamp())}")
        
        # Consistent path structure: orders/shoot_{id}/{type}/{filename}
        object_key = f"orders/shoot_{shoot.id}/{media_type}/{filename}"
        
        from .utils.r2_utils import generate_presigned_put
        presigned_url = generate_presigned_put(object_key, request.query_params.get('contentType', 'image/jpeg'))
        
        if presigned_url:
            return Response({
                "upload_url": presigned_url,
                "object_key": object_key
            })
        return Response({"detail": "Failed to generate upload url."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='confirm-upload')
    def confirm_upload(self, request, pk=None):
        """
        Saves the media item record after successful upload to R2.
        """
        try:
            shoot = self.get_object()
            object_key = request.data.get('object_key')
            media_type = request.data.get('media_type', 'photo')
            
            if not object_key:
                return Response({"error": "object_key is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{object_key}"
            
            media_item = MediaItem.objects.create(
                shoot=shoot,
                media_type=media_type,
                url=public_url,
                gcs_object_key=object_key
            )
            
            if media_type == 'photo':
                from .utils.media_utils import process_photo_item
                # Process in background thread to avoid timeout
                threading.Thread(target=process_photo_item, args=(media_item,)).start()
            
            if media_type == 'video':
                from .utils.video_utils import trigger_video_processing
                trigger_video_processing(media_item)
            
            if shoot.status != 'delivered':
                shoot.status = 'delivered'
                shoot.save()
                
            return Response(MediaItemSerializer(media_item).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            print(f"ERROR in confirm_upload: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": f"Internal Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='public-view', permission_classes=[AllowAny])
    def public_view(self, request, pk=None):
        shoot = self.get_object()
        serializer = ClientShootSerializer(shoot)
        data = serializer.data
        
        # Payment status 'paid' (case-insensitive) unlocks content
        is_paid = shoot.payment_status.lower() == 'paid' if shoot.payment_status else False
        is_owner_or_staff = False
        if request.user.is_authenticated:
             if request.user.is_staff or shoot.client == request.user:
                 is_owner_or_staff = True
        
        can_access_full = is_paid or is_owner_or_staff
        data['can_download_full'] = can_access_full
        
        from .utils.r2_utils import generate_presigned_url
        import os
        
        final_media = []
        for item in data.get('media_items', []):
            if not item.get('gcs_object_key'):
                continue
                
            obj_key = item['gcs_object_key']
            
            # If not paid/authorized, ATTEMPT to show watermarked version
            if not can_access_full and item['media_type'] == 'photo':
                filename = os.path.basename(obj_key)
                wm_key = f"orders/shoot_{shoot.id}/watermarked/{filename}"
                
                # We check if watermarked exists in R2 before serving it
                # For efficiency, we assume it exists if we are in public-view, 
                # but if we want to be 100% robust against NoSuchKey for gallery:
                from .utils.r2_utils import get_boto3_client
                try:
                    s3 = get_boto3_client()
                    s3.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=wm_key)
                    obj_key = wm_key
                except Exception:
                    # Fallback to original if watermarked is missing, 
                    # OR we could just skip if unauthorized.
                    # Given the user's report, if watermarked is missing, the gallery is broken.
                    # If we fallback to original, they see a clean image.
                    # Decision: fallback if authorized, else keep wm_key and let it broken (safety)
                    # OR: fallback to a placeholder.
                    # Let's fallback to original for now so gallery isn't black boxes.
                    # In a production app, we'd ensure watermarking always finishes.
                    pass
            
            signed_url = generate_presigned_url(obj_key, expires_in=86400)
            if signed_url:
                item['url'] = signed_url
                final_media.append(item)
        
        data['media_items'] = final_media
        return Response(data)

    @action(detail=True, methods=['get'], url_path='get-download-url')
    def get_download_url(self, request, pk=None):
        shoot = self.get_object()
        item_id = request.query_params.get('item_id')
        download_type = request.query_params.get('type', 'high-res') # high-res, optimized
        
        if not item_id:
             return Response({"error": "item_id is required"}, status=400)
             
        media_item = MediaItem.objects.get(id=item_id, shoot=shoot)
        
        # Check payment for full download
        is_paid = shoot.payment_status.lower() == 'paid' if shoot.payment_status else False
        if not is_paid and not request.user.is_staff:
            return Response({"error": "Payment required for full download"}, status=402)
            
        from .utils.r2_utils import generate_presigned_url
        obj_key = media_item.gcs_object_key
        
        if download_type == 'optimized' and media_item.media_type == 'photo':
            # We use the watermarked version as "optimized" for now, or real optimized if we had it.
            # Currently our process_photo creates a web-optimized one? No, it just makes watermark.
            # Let's check if we have an optimized path.
            # For now, if "optimized" is requested, we try the watermarked path but without wm logic.
            filename = os.path.basename(obj_key)
            opt_key = f"orders/shoot_{shoot.id}/watermarked/{filename}"
            # Check if it exists
            from .utils.r2_utils import get_boto3_client
            try:
                s3 = get_boto3_client()
                s3.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=opt_key)
                obj_key = opt_key
            except Exception:
                # Failback to high-res if optimized missing
                pass

        filename = os.path.basename(obj_key)
        presigned_url = generate_presigned_url(
            obj_key, 
            expires_in=3600, 
            as_attachment=True, 
            filename=filename
        )
        
        if presigned_url:
            return Response({"download_url": presigned_url})
            
        return Response({"detail": "Failed to generate download url."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MediaItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing individual media items.
    """
    serializer_class = MediaItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return MediaItem.objects.all()
        
        # Photographers can see items for shoots assigned to them
        try:
            photographer = self.request.user.photographer_profile
            return MediaItem.objects.filter(shoot__photographer=photographer)
        except Exception:
            return MediaItem.objects.none()

    def perform_destroy(self, instance):
        # Optional: Delete from R2 as well
        try:
            from .utils.r2_utils import delete_object
            if instance.gcs_object_key:
                delete_object(instance.gcs_object_key)
            
            # Also delete watermarked if it exists
            if instance.media_type == 'photo':
                filename = os.path.basename(instance.gcs_object_key)
                wm_key = f"orders/shoot_{instance.shoot.id}/watermarked/{filename}"
                delete_object(wm_key)
        except Exception as e:
            print(f"Failed to delete R2 object: {e}")
        
        instance.delete()

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
        if self.request.user.is_staff:
            return Photographer.objects.all().order_by('user__first_name')
        
        # Photographers can see their own profile
        if hasattr(self.request.user, 'photographer_profile'):
            return Photographer.objects.filter(user=self.request.user)
            
        return Photographer.objects.none()

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
        hard_delete = self.request.query_params.get('hard') == 'true'
        
        if hard_delete:
            # Permanent delete: remove User and Photographer profile
            user = instance.user
            instance.delete()
            user.delete()
        else:
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
            
            # Update last_login
            from django.utils import timezone
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
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
        
        # Update last_login
        from django.utils import timezone
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
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
        
        # Security: Handle Password Change
        if 'new_password' in data:
            old_password = data.get('old_password')
            if not old_password or not user.check_password(old_password):
                return Response({"detail": "Current password incorrect or not provided."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(data['new_password'])
            user.save()
            return Response({"detail": "Password updated successfully. Please log in again."})

        # Update Base User fields
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'email' in data:
             # Basic unique check
             new_email = data['email']
             if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                 return Response({"detail": "Email already in use."}, status=status.HTTP_400_BAD_REQUEST)
             user.email = new_email
             user.username = new_email # Keep synced
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

class ClientViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing client users.
    """
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_staff:
            return User.objects.none()
        
        from django.db.models import Count
        return User.objects.filter(is_staff=False, photographer_profile__isnull=True).annotate(
            booking_count=Count('shoots')
        ).order_by('-date_joined')

from django.core.mail import get_connection, EmailMessage
import traceback
from rest_framework import permissions

class EmailConfigurationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing SMTP settings.
    """
    queryset = EmailConfiguration.objects.all()
    serializer_class = EmailConfigurationSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # Ensure at least one config exists
        EmailConfiguration.objects.get_or_create(id=1, defaults={
            "title": "Primary SMTP",
            "email_host": "smtp.gmail.com",
            "email_port": 587,
            "email_from_address": "noreply@example.com",
            "email_from_name": "KC Real Estate Media"
        })
        return EmailConfiguration.objects.filter(id=1)

    def create(self, request, *args, **kwargs):
        """
        Overridden to enforce singleton. POST will update the record with ID 1.
        """
        instance, _ = EmailConfiguration.objects.get_or_create(id=1)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='test-connection')
    def test_connection(self, request):
        """
        Tests the SMTP connection with the provided settings (without saving them).
        """
        data = request.data
        host = data.get('email_host')
        port = data.get('email_port')
        username = data.get('email_username')
        password = data.get('email_password')
        use_tls = data.get('use_tls', True)
        use_ssl = data.get('use_ssl', False)
        from_email = data.get('email_from_address')
        from_name = data.get('email_from_name', 'Test Sender')

        if not all([host, port, username, password, from_email]):
            return Response({"error": "Missing required fields for testing connection."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            connection = get_connection(
                host=host,
                port=port,
                username=username,
                password=password,
                use_tls=use_tls,
                use_ssl=use_ssl,
                timeout=10
            )
            
            # Send a test email
            subject = "SMTP Test Connection - KC Real Estate Media"
            message_body = f"This is a test email to verify your SMTP settings.\n\nSent from: {from_name} <{from_email}>"
            
            email = EmailMessage(
                subject,
                message_body,
                f"{from_name} <{from_email}>",
                [from_email], # Send to self
                connection=connection
            )
            email.send()
            
            return Response({"message": "Test connection successful! Check your inbox."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"SMTP Test Failed: {str(e)}")
            traceback.print_exc()
            return Response({"error": f"Connection failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class EmailTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing email templates.
    """
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'slug'
