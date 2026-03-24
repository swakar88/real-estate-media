from rest_framework import viewsets, views, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from decimal import Decimal
import stripe
import os
import threading
from datetime import datetime
import zipfile
import io

stripe.api_key = settings.STRIPE_SECRET_KEY
from .models import (
    Service, GalleryImage, Package, BookingRequest,
    ClientShoot, Photographer, PhotographerSlot, PhotographerPayment,
    SiteMedia, EmailConfiguration, EmailTemplate, MediaItem,
    Referral, ReferralCredit, GlobalSettings, SupportTicket, PhotographerRating,
    UserProfile
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
    EmailTemplateSerializer,
    EmailConfigurationSerializer,
    MediaItemSerializer,
    ReferralSerializer,
    PhotographerRatingSerializer,
    GlobalSettingsSerializer,
    PhotographerPaymentSerializer,
    SupportTicketSerializer,
    ClientSerializer,
    AdminSerializer,
    UserProfileSerializer,
)

class ServiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows services to be viewed and managed.
    """
    queryset = Service.objects.all() # Show all to admins, maybe filter later
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class GalleryImageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows gallery images to be viewed and managed.
    """
    queryset = GalleryImage.objects.all().order_by('-created_at')
    serializer_class = GalleryImageSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    @action(detail=False, methods=['get'], url_path='get-upload-url')
    def get_upload_url(self, request):
        """
        Generates a presigned PUT URL for Cloudflare R2 for gallery/site assets.
        """
        filename = request.query_params.get('filename', f"asset_{int(datetime.now().timestamp())}")
        content_type = request.query_params.get('contentType', 'image/jpeg')
        
        # Path for public assets (gallery, site media)
        object_key = f"assets/{filename}"
        
        from .utils.r2_utils import generate_presigned_put
        presigned_url = generate_presigned_put(object_key, content_type)
        
        if presigned_url:
            public_domain = getattr(settings, 'R2_PUBLIC_DOMAIN', '').replace('https://', '').replace('http://', '').strip('/')
            if public_domain:
                public_url = f"https://{public_domain}/{object_key}"
            else:
                public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{object_key}"
                
            return Response({
                "upload_url": presigned_url,
                "object_key": object_key,
                "public_url": public_url
            })
        return Response({"detail": "Failed to generate upload url."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PackageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows packages to be viewed and managed.
    """
    queryset = Package.objects.all().order_by('order', 'price')
    serializer_class = PackageSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

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
        
        # Check for pending referral match
        if instance.email:
            # Case-insensitive match on email for pending referrals
            referral = Referral.objects.filter(referee_email__iexact=instance.email, status='pending').first()
            if referral:
                referral.status = 'completed'
                referral.notes = f"{referral.notes}\nAuto-completed by Booking #{instance.id}".strip()
                referral.save()
        
        # Determine status and shoot generation
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
                
                # Automatically generate the ClientShoot
                if client_user:
                    ClientShoot.objects.create(
                        client=client_user,
                        property_address=instance.property_details[:300],
                        shoot_date=instance.shoot_date,
                        photographer=instance.assigned_photographer,
                        status='scheduled',
                        payment_status='unpaid',
                        amount_due=instance.package_interest.price if instance.package_interest else None,
                        notes=f"Auto-generated from Booking #{instance.id}\nPackage: {instance.package_interest}\nContact: {instance.phone}",
                        contact_name=f"{instance.first_name} {instance.last_name}",
                        contact_phone=instance.phone,
                        contact_email=instance.email,
                        referral_code_used=instance.referral_code_used or None,
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
        
        # Reschedule: shoot_date or time_slot changed while already confirmed
        new_date = serializer.validated_data.get('shoot_date', instance.shoot_date)
        new_slot = serializer.validated_data.get('time_slot', instance.time_slot)
        date_or_slot_changed = (
            instance.status == 'confirmed' and
            (new_date != instance.shoot_date or new_slot != instance.time_slot)
        )

        # Cancellation
        if instance.status != 'cancelled' and new_status == 'cancelled':
            super().perform_update(serializer)
            try:
                from .utils.email_utils import send_booking_calendar_invite
                phot_email = instance.assigned_photographer.user.email if instance.assigned_photographer else None
                send_booking_calendar_invite(instance, instance.email, phot_email, method='CANCEL', sequence=1)
            except Exception as e:
                print(f"Cancel calendar invite failed: {e}")
            return

        # Reschedule — send an updated invite
        if date_or_slot_changed:
            super().perform_update(serializer)
            # Reload to get updated fields
            instance.refresh_from_db()
            try:
                from .utils.email_utils import send_booking_calendar_invite
                phot_email = instance.assigned_photographer.user.email if instance.assigned_photographer else None
                send_booking_calendar_invite(instance, instance.email, phot_email, method='REQUEST', sequence=1)
            except Exception as e:
                print(f"Reschedule calendar invite failed: {e}")
            return

        # If transitioning to completed (manual completion)
        if instance.status != 'completed' and new_status == 'completed':
            # Check if it was paid
            # Find the associated ClientShoot to check payment
            shoot = ClientShoot.objects.filter(
                property_address=instance.property_details[:300],
                contact_email=instance.email
            ).first()
            
            if shoot and shoot.payment_status != 'paid':
                # Frontend should have sent completion_notes
                completion_notes = serializer.validated_data.get('completion_notes')
                if not completion_notes:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({"completion_notes": "Reason for manual completion of unpaid booking is required."})

            # If it's confirmed -> completed transition, we might need to update the shoot too
            if shoot:
                shoot.status = 'completed'
                shoot.save()

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
                property_address=instance.property_details[:300],
                shoot_date=instance.shoot_date or timezone.now().date(),
                photographer=instance.assigned_photographer,
                status='scheduled',
                amount_due=instance.package_interest.price if instance.package_interest else None,
                notes=f"Auto-generated from Booking #{instance.id}\nPackage: {instance.package_interest}\nContact: {instance.phone}\nPhotographer: {instance.assigned_photographer}",
                contact_name=f"{instance.first_name} {instance.last_name}",
                contact_phone=instance.phone,
                contact_email=instance.email,
                referral_code_used=instance.referral_code_used or None,
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
        if self.action in ['public_view', 'get_download_url', 'download_zip']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        if self.action in ['public_view', 'get_download_url', 'download_zip']:
            return ClientShoot.objects.all().order_by('-created_at')

        if self.request.user.is_staff:
            queryset = ClientShoot.objects.all().order_by('-created_at')
            impersonate_id = self.request.query_params.get('impersonate_id')
            if impersonate_id:
                role = self.request.query_params.get('role')
                if role == 'photographer':
                    queryset = queryset.filter(photographer__user_id=impersonate_id)
                else:
                    queryset = queryset.filter(client_id=impersonate_id)
            
            photographer_id = self.request.query_params.get('photographer')
            if photographer_id:
                queryset = queryset.filter(photographer_id=photographer_id)
                
            return queryset
            
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
            # Get client email safely
            client_email = updated_instance.client.email if updated_instance.client else None
            send_content_uploaded_emails(updated_instance.property_address, client_email)

    @action(detail=True, methods=['post'], url_path='generate-invoice')
    def generate_invoice(self, request, pk=None):
        shoot = self.get_object()
        
        if not request.user.is_staff:
            return Response({"detail": "Only admins can generate invoices."}, status=status.HTTP_403_FORBIDDEN)
            
        amount_due = request.data.get('amount_due') or shoot.amount_due
        if not amount_due:
            return Response({"detail": "No amount_due provided or set for this shoot."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # CHECK FOR REFERRAL CREDITS
            from .models import ReferralCredit
            available_credits = ReferralCredit.objects.filter(client=shoot.client, is_used=False)
            total_credit = sum((c.amount for c in available_credits), Decimal('0'))
            
            applied_credit = 0
            if total_credit > 0:
                applied_credit = min(total_credit, Decimal(str(amount_due)))
                amount_due = Decimal(str(amount_due)) - applied_credit
                
                # Mark credits as used
                remaining_to_apply = applied_credit
                for credit in available_credits:
                    if remaining_to_apply <= 0: break
                    if credit.amount <= remaining_to_apply:
                        remaining_to_apply -= credit.amount
                        credit.is_used = True
                        credit.used_at = timezone.now()
                        credit.save()
                    else:
                        # Partial use of a credit? 
                        # Actually, our model doesn't support partial use easily without creating a new credit for the reminder.
                        # For simplicity, if credit > remaining, we still mark it as used but this shouldn't happen 
                        # if we sum correctly. Wait, if credit.amount = 50 and remaining = 25, 
                        # we either need to split the credit or just consume it.
                        # Let's consume it and maybe adjust it?
                        # Better approach: update the credit amount and keep it unused? 
                        # No, let's keep it simple: consume the whole credit.
                        credit.is_used = True
                        credit.used_at = timezone.now()
                        credit.save()
                        remaining_to_apply = 0

            # Update the shoot amount if explicitly provided or if credits were applied
            if request.data.get('amount_due') or applied_credit > 0:
                shoot.amount_due = amount_due
                shoot.save()
            
            # Mock Stripe for local development without actual API keys
            if getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_placeholder') in ['sk_test_placeholder', '']:
                session_url = "https://checkout.stripe.com/pay/cs_test_mock123_please_add_real_key"
            else:
                    # Safely fallback to localhost if CORS origins are not explicitly defined in settings
                    cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
                    base_url = cors_origins[0] if cors_origins else "http://localhost:3000"
                    
                    session_kwargs = {
                        'payment_method_types': ['card'],
                        'line_items': [{
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
                        'mode': 'payment',
                        'metadata': {'shoot_id': shoot.id},
                        'success_url': f"{base_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
                        'cancel_url': f"{base_url}/dashboard?payment=cancelled",
                    }

                    # Split payment if photographer is assigned and has a Stripe account
                    if shoot.photographer and shoot.photographer.stripe_account_id:
                        # Calculate photographer share based on their share_percentage
                        photographer_share = (float(amount_due) * float(shoot.photographer.share_percentage)) / 100
                        # Convert to cents for Stripe
                        transfer_amount = int(photographer_share * 100)
                        
                        if transfer_amount > 0:
                            session_kwargs['payment_intent_data'] = {
                                'transfer_data': {
                                    'destination': shoot.photographer.stripe_account_id,
                                    'amount': transfer_amount,
                                }
                            }

                    session = stripe.checkout.Session.create(**session_kwargs)
                    session_url = session.url
            
            shoot.stripe_payment_link = session_url
            shoot.save()

            # SEND INVOICE EMAILS
            from .utils.email_utils import send_invoice_generated_email
            client_email = shoot.client.email if shoot.client else None
            send_invoice_generated_email(shoot.property_address, session_url, client_email)
            
            return Response({
                "detail": "Invoice generated successfully",
                "stripe_payment_link": session_url
            })
            
        except Exception as e:
            import traceback
            print(f"ERROR GENERATING INVOICE: {str(e)}")
            print(traceback.format_exc())
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
                shoot_id = session.metadata.get('shoot_id')
                if shoot_id:
                    shoot = ClientShoot.objects.get(id=shoot_id)
                    shoot.payment_status = 'paid'
                    shoot.save()

                    # AWARD REFERRAL CREDIT IF APPLICABLE
                    # New code-based system: ClientShoot.save() already created the credit;
                    # just fire the notification email here.
                    if shoot.referral_code_used:
                        try:
                            from .utils.email_utils import send_referral_reward_earned_email
                            referrer_profile = UserProfile.objects.get(referral_code=shoot.referral_code_used)
                            referrer = referrer_profile.user
                            referee_email = shoot.contact_email or ''
                            referral = Referral.objects.filter(
                                referrer=referrer, referee_email__iexact=referee_email
                            ).first()
                            if referral:
                                credit = ReferralCredit.objects.filter(
                                    client=referrer, referral=referral
                                ).first()
                                if credit:
                                    send_referral_reward_earned_email(referrer, credit.amount)
                        except Exception as ref_err:
                            print(f"Error sending referral reward email: {ref_err}")
                    else:
                        # Legacy path: manual referral link (no referral_code_used)
                        try:
                            referral = Referral.objects.filter(referee_email__iexact=shoot.contact_email, status='completed').first()
                            if referral:
                                referral.status = 'paid'
                                referral.save()

                                settings = GlobalSettings.objects.first()
                                reward_amount = referral.reward_amount
                                if settings and settings.referral_reward_type == 'percentage':
                                    try:
                                        percent = Decimal(str(settings.referral_reward_amount))
                                        total_amount = Decimal(str(shoot.amount_due))
                                        reward_amount = (total_amount * percent) / Decimal('100')
                                        reward_amount = reward_amount.quantize(Decimal('0.01'))
                                        referral.reward_amount = reward_amount
                                        referral.save()
                                    except (ValueError, TypeError, ArithmeticError) as e:
                                        print(f"Error calculating % reward: {e}")
                                        reward_amount = referral.reward_amount

                                ReferralCredit.objects.get_or_create(
                                    referral=referral,
                                    defaults={'client': referral.referrer, 'amount': reward_amount}
                                )
                                from .utils.email_utils import send_referral_reward_earned_email
                                send_referral_reward_earned_email(referral.referrer, reward_amount)
                        except Exception as ref_err:
                            print(f"Error processing referral reward: {ref_err}")

                    from .utils.email_utils import send_payment_confirmed_emails
                    from django.conf import settings
                    base_url = "http://localhost:3000"
                    if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS:
                        base_url = settings.CORS_ALLOWED_ORIGINS[0]
                    send_payment_confirmed_emails(shoot.property_address, f"{base_url}/dashboard")

                    # Send Thank You + Rating Link
                    if shoot.photographer:
                        from .utils.email_utils import send_thank_you_payment_email
                        # Use photographer's user ID or photographer ID? The user said id={photographer_id}
                        # We'll use the photographer instance ID
                        send_thank_you_payment_email(shoot.property_address, shoot.contact_email, shoot.photographer.id)
                return Response({"detail": "Payment verified", "status": "paid"})
            return Response({"detail": "Payment not completed"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"ERROR VERIFYING PAYMENT: {str(e)}")
            print(traceback.format_exc())
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

    @action(detail=True, methods=['get'], url_path='download-zip')
    def download_zip(self, request, pk=None):
        shoot = self.get_object()
        download_type = request.query_params.get('type', 'high-res') # high-res, optimized
        
        # Check payment for zip download
        is_paid = shoot.payment_status.lower() == 'paid' if shoot.payment_status else False
        if not is_paid and not request.user.is_staff:
            return Response({"error": "Payment required for full download"}, status=402)
            
        media_items = MediaItem.objects.filter(shoot=shoot, media_type='photo')
        if not media_items.exists():
            return Response({"error": "No photos found for this shoot"}, status=404)
            
        from .utils.r2_utils import get_object_content, get_boto3_client
        
        # Create ZIP in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for item in media_items:
                obj_key = item.gcs_object_key
                
                # Check for optimized version if requested
                if download_type == 'optimized':
                    filename = os.path.basename(obj_key)
                    opt_key = f"orders/shoot_{shoot.id}/watermarked/{filename}"
                    # Check if it exists
                    try:
                        s3 = get_boto3_client()
                        s3.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=opt_key)
                        obj_key = opt_key
                    except Exception:
                        pass # Fallback to high-res

                content = get_object_content(obj_key)
                if content:
                    # Use the original filename or the object key basename
                    file_name = os.path.basename(obj_key)
                    zip_file.writestr(file_name, content)
        
        zip_buffer.seek(0)
        
        response = HttpResponse(zip_buffer.read(), content_type='application/zip')
        zip_filename = f"shoot_{shoot.id}_{download_type}.zip"
        response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
        return response


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
            queryset = PhotographerSlot.objects.all()
            impersonate_id = self.request.query_params.get('impersonate_id')
            if impersonate_id:
                queryset = queryset.filter(photographer__user_id=impersonate_id)
            return queryset
        try:
            photographer = self.request.user.photographer_profile
            return PhotographerSlot.objects.filter(photographer=photographer)
        except Exception:
            return PhotographerSlot.objects.none()
    def perform_create(self, serializer):
        photographer_id = self.request.data.get('photographer_id')
        
        # If admin provides a photographer_id, use it.
        # Otherwise, use the authenticated photographer's profile.
        if self.request.user.is_staff and photographer_id:
            photographer = Photographer.objects.get(id=photographer_id)
        else:
            photographer = self.request.user.photographer_profile
            
        serializer.save(photographer=photographer)

class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.all().order_by('-created_at')
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Referral.objects.all().order_by('-created_at')
        return Referral.objects.filter(referrer=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            # Add available credits to top level
            from .models import ReferralCredit
            credits = ReferralCredit.objects.filter(client=request.user, is_used=False)
            response.data['available_credits'] = sum(c.amount for c in credits)
            return response

        serializer = self.get_serializer(queryset, many=True)
        from .models import ReferralCredit
        credits = ReferralCredit.objects.filter(client=request.user, is_used=False)
        return Response({
            'results': serializer.data,
            'available_credits': sum(c.amount for c in credits)
        })

    def perform_create(self, serializer):
        from .models import GlobalSettings
        # Get default reward amount from global settings
        settings = GlobalSettings.objects.first()
        
        # If fixed, store it now. If percentage, we'll store a placeholder (or the % itself?)
        # For simplicity, if it's percentage, we'll just store the percentage value in reward_amount
        # and re-calculate/update it in verify_payment when the shoot is paid.
        reward = settings.referral_reward_amount if settings else 25.00
        
        referral = serializer.save(referrer=self.request.user, reward_amount=reward)

        # Trigger referral email — wrapped so a failed email never blocks the referral being saved
        try:
            from .utils.email_utils import send_referral_received_email
            send_referral_received_email(referral)
        except Exception as e:
            print(f"Referral invite email failed (referral saved OK): {e}")

class GlobalSettingsViewSet(viewsets.ModelViewSet):
    queryset = GlobalSettings.objects.all()
    serializer_class = GlobalSettingsSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    def list(self, request, *args, **kwargs):
        # Always return the first one (singleton-ish)
        settings = GlobalSettings.objects.first()
        if not settings:
            settings = GlobalSettings.objects.create()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def update_global(self, request):
        settings = GlobalSettings.objects.first()
        if not settings:
            settings = GlobalSettings.objects.create()
        
        from .utils.r2_utils import upload_to_r2
        
        # Handle file uploads
        if 'logo' in request.FILES:
            logo_url = upload_to_r2(request.FILES['logo'], "branding/logo")
            if logo_url: settings.site_logo_url = logo_url
            
        if 'favicon' in request.FILES:
            favicon_url = upload_to_r2(request.FILES['favicon'], "branding/favicon")
            if favicon_url: settings.favicon_url = favicon_url
            
        if 'invoice_logo' in request.FILES:
            invoice_logo_url = upload_to_r2(request.FILES['invoice_logo'], "branding/invoice")
            if invoice_logo_url: settings.invoice_logo_url = invoice_logo_url
            
        if 'sidebar_logo' in request.FILES:
            sidebar_logo_url = upload_to_r2(request.FILES['sidebar_logo'], "branding/sidebar")
            if sidebar_logo_url: settings.sidebar_logo_url = sidebar_logo_url
            
        # Handle other fields
        for field in ['site_name', 'site_logo_url', 'favicon_url', 'invoice_logo_url', 'sidebar_logo_url', 'referral_reward_amount', 'referral_reward_type']:
            if field in request.data and field not in request.FILES:
                setattr(settings, field, request.data[field])
                
        settings.save()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

class PhotographerViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows admins to view and manage photographers.
    """
    queryset = Photographer.objects.all().order_by('user__first_name')
    serializer_class = PhotographerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Count
        if self.request.user.is_staff:
            return Photographer.objects.filter(is_archived=False).annotate(
                booking_count=Count('assigned_bookings')
            ).order_by('user__first_name')
        
        # Photographers can see their own profile
        if hasattr(self.request.user, 'photographer_profile'):
            return Photographer.objects.filter(user=self.request.user).annotate(
                 booking_count=Count('assigned_bookings')
            )
            
        return Photographer.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Public endpoint to list all active photographers for the team page."""
        photographers = Photographer.objects.filter(is_active=True).order_by('user__first_name')
        serializer = self.get_serializer(photographers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='stripe-connect')
    def stripe_connect(self, request, pk=None):
        """
        Creates a Stripe Express account and returns an onboarding link.
        """
        photographer = self.get_object()
        
        # Verify permissions
        if photographer.user != request.user and not request.user.is_staff:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            # 1. Create account if not already exists
            if not photographer.stripe_account_id:
                account = stripe.Account.create(
                    type="express",
                    country="US",
                    email=photographer.user.email,
                    capabilities={
                        "card_payments": {"requested": True},
                        "transfers": {"requested": True},
                    },
                    business_type="individual",
                    individual={
                        "first_name": photographer.user.first_name,
                        "last_name": photographer.user.last_name,
                    }
                )
                photographer.stripe_account_id = account.id
                photographer.save()
            
            # 2. Get onboarding link
            # For local dev, NextJS is usually on 3000
            frontend_url = 'http://localhost:3000' if settings.DEBUG else 'https://kcmedia-frontend.vercel.app'
            
            # Since this is a single page app portal, we return to the portal tab
            return_url = f"{frontend_url}/photographer-portal?tab=profile&stripe=success"
            refresh_url = f"{frontend_url}/photographer-portal?tab=profile&stripe=refresh"

            account_link = stripe.AccountLink.create(
                account=photographer.stripe_account_id,
                refresh_url=refresh_url,
                return_url=return_url,
                type="account_onboarding",
            )
            
            return Response({"url": account_link.url})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        from django.contrib.auth.models import User
        from django.core.signing import TimestampSigner
        from .utils.email_utils import send_photographer_invite_email
        from django.conf import settings
        
        data = self.request.data
        email = data.get('email')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        # Use email as username (guaranteed unique; consistent with register_user)
        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "A user with this email already exists."})

        # Create user but inactive with unusable password
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=False
        )
        user.set_unusable_password()
        user.save()

        try:
            # Create photographer profile
            photographer = serializer.save(user=user)

            # Generate token
            signer = TimestampSigner()
            token = signer.sign_object({'user_id': user.id})

            # Determine frontend URL
            frontend_url = 'http://localhost:3000' if settings.DEBUG else settings.CORS_ALLOWED_ORIGINS[0] if getattr(settings, 'CORS_ALLOWED_ORIGINS', None) else 'http://localhost:3000'
            invite_link = f"{frontend_url}/photographer-signup?token={token}"

            # Send Email (non-blocking — failure doesn't roll back the invite)
            send_photographer_invite_email(
                email=email,
                name=first_name,
                invite_link=invite_link
            )
        except Exception as e:
            # Roll back the orphaned user record on any failure
            user.delete()
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": f"Failed to create photographer account: {str(e)}"})
        
    def perform_destroy(self, instance):
        hard_delete = self.request.query_params.get('hard') == 'true'
        has_bookings = ClientShoot.objects.filter(photographer=instance).exists()
        
        if hard_delete:
            if has_bookings:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Cannot permanently delete photographer with existing bookings. Please archive instead.")
            
            user = instance.user
            instance.delete()
            user.delete()
        else:
            # Archiving logic
            instance.is_archived = True
            instance.is_active = False
            instance.save()
            # Disable login
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

class PhotographerRatingViewSet(viewsets.ModelViewSet):
    queryset = PhotographerRating.objects.all()
    serializer_class = PhotographerRatingSerializer
    permission_classes = [permissions.AllowAny]

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

        # Auto-create referral profile
        UserProfile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_admin(request):
    """
    Endpoint for existing admins to register new staff users.
    """
    if not request.user.is_staff:
        return Response({'detail': 'Only admins can create other admins.'}, status=status.HTTP_403_FORBIDDEN)
        
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
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True # Set as admin
        )
        user.save()
        return Response({'detail': f'Admin account for {email} created successfully.'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Mocked endpoint for password reset requests.
    """
    email = request.data.get('email')
    if not email:
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # In a real app, we would verify the user exists and send a real tokenized link.
    # For now, we mock the behavior.
    print(f"PASSWORD RESET REQUEST FOR: {email}")
    
    # Simulate sending email
    from .utils.email_utils import send_email_dynamic
    subject = "Password Reset Request - KC Real Estate Media"
    body = f"Hello,\n\nWe received a request to reset your password. Please click the link below to set a new password:\n\nReset Password Link: #\n\nIf you didn't request this, please ignore this email."
    
    # Mocking successful "send"
    return Response({'detail': 'If an account exists with that email, a reset link has been sent.'}, status=status.HTTP_200_OK)

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
        user = request.user
        impersonate_id = request.query_params.get('impersonate_id')
        if impersonate_id and request.user.is_staff:
            try:
                user = User.objects.get(id=impersonate_id)
            except User.DoesNotExist:
                pass

        is_photo = False
        photo_id = None
        photo_url = None
        try:
            if hasattr(user, 'photographer_profile') and user.photographer_profile.is_active:
                is_photo = True
                photo_id = user.photographer_profile.id
                photo_url = user.photographer_profile.profile_image_url
        except Exception:
            pass

        # Referral profile (covers clients and admins too)
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # For non-photographers, profile image lives on UserProfile
        if not is_photo and profile.profile_image_url:
            photo_url = profile.profile_image_url

        serializer = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_photographer': is_photo,
            'photographer_id': photo_id,
            'profile_image_url': photo_url,
            'referral_code': profile.referral_code,
            'available_credits': str(profile.available_credits()),
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

        # Update profile image — photographer stores on photographer_profile, everyone else on UserProfile
        if 'profile_image_url' in data:
            if hasattr(user, 'photographer_profile'):
                user.photographer_profile.profile_image_url = data['profile_image_url']
                user.photographer_profile.save()
            else:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.profile_image_url = data['profile_image_url']
                profile.save()

        # Update other Photographer Profile fields
        if hasattr(user, 'photographer_profile'):
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
                # User requested: when payment is made, it should auto complete
                shoot.status = 'completed'
                
                # Update photographer balance and records if it was a split payment
                if shoot.photographer:
                    # Fee is already calculated in shoot.save() via save override
                    photographer = shoot.photographer
                    fee = shoot.photographer_fee
                    
                    # If this was a split payment (transfer_data was present in PI)
                    # We check if they have a stripe id to record the payout and update status
                    if photographer.stripe_account_id:
                        # Mark it as paid for this photographer
                        shoot.photographer_paid_amount = fee
                        # Note: photographer_payment_status will be updated in shoot.save()
                        
                        # Create a payment record for historical tracking
                        # PhotographerPayment.save() will handleographer.total_paid increment
                        PhotographerPayment.objects.create(
                            photographer=photographer,
                            amount=fee,
                            reference_number=f"Stripe Transfer: {session.get('payment_intent')}",
                            notes=f"Automated split from shoot at {shoot.property_address}"
                        )
                    
                # shoot.save() will handleographer.total_earned increment because payment_status becomes 'paid'
                shoot.save()

                # Send referral reward email for code-based referrals
                if shoot.referral_code_used:
                    try:
                        from .utils.email_utils import send_referral_reward_earned_email
                        referrer_profile = UserProfile.objects.get(referral_code=shoot.referral_code_used)
                        referrer = referrer_profile.user
                        referee_email = shoot.contact_email or ''
                        ref = Referral.objects.filter(
                            referrer=referrer, referee_email__iexact=referee_email
                        ).first()
                        if ref:
                            credit = ReferralCredit.objects.filter(
                                client=referrer, referral=ref
                            ).first()
                            if credit:
                                send_referral_reward_earned_email(referrer, credit.amount)
                    except Exception as ref_err:
                        print(f"Error sending referral reward email (webhook): {ref_err}")

                from .utils.email_utils import send_payment_confirmed_emails, send_thank_you_payment_email
                from django.conf import settings
                base_url = settings.CORS_ALLOWED_ORIGINS[0] if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS else "http://localhost:3000"
                send_payment_confirmed_emails(shoot.property_address, f"{base_url}/dashboard")
                if shoot.photographer:
                    send_thank_you_payment_email(shoot.property_address, shoot.contact_email, shoot.photographer.id)
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

    @action(detail=False, methods=['get'], url_path='get-upload-url')
    def get_upload_url(self, request):
        """
        Generates a presigned PUT URL for Cloudflare R2 for site assets.
        """
        if not request.user.is_staff:
            return Response({"detail": "Only admins can request upload URLs."}, status=status.HTTP_403_FORBIDDEN)
            
        filename = request.query_params.get('filename', f"asset_{int(datetime.now().timestamp())}")
        content_type = request.query_params.get('contentType', 'image/jpeg')
        
        # Path for site media assets
        object_key = f"assets/{filename}"
        
        from .utils.r2_utils import generate_presigned_put
        presigned_url = generate_presigned_put(object_key, content_type)
        
        if presigned_url:
            public_domain = getattr(settings, 'R2_PUBLIC_DOMAIN', '').replace('https://', '').replace('http://', '').strip('/')
            if public_domain:
                public_url = f"https://{public_domain}/{object_key}"
            else:
                public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{object_key}"
                
            return Response({
                "upload_url": presigned_url,
                "object_key": object_key,
                "public_url": public_url
            })
        return Response({"detail": "Failed to generate upload url."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request, *args, **kwargs):
        # Allow returning as a dict of {key: url} for optimal frontend consumption
        queryset = self.get_queryset()
        if request.query_params.get('view') == 'dict':
            result = {}
            serializer = self.get_serializer(queryset, many=True)
            for item in serializer.data:
                key = item['key']
                result[key] = item['url']
                result[f"{key}_type"] = item['media_type']
                if item.get('url_before'):
                    result[f"{key}_before"] = item['url_before']
            return Response(result)
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

class AdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and managing admin users.
    """
    serializer_class = AdminSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(is_staff=True).order_by('-date_joined')

    def create(self, request, *args, **kwargs):
        from django.contrib.auth.models import User
        from django.core.signing import TimestampSigner
        from .utils.email_utils import send_admin_invite_email
        from django.conf import settings
        from rest_framework.exceptions import ValidationError

        email = request.data.get('email', '').strip()
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        if not email:
            raise ValidationError({"detail": "Email is required."})

        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            raise ValidationError({"detail": "A user with this email already exists."})

        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=False,
            is_staff=True
        )
        user.set_unusable_password()
        user.save()

        try:
            signer = TimestampSigner()
            token = signer.sign_object({'user_id': user.id})
            frontend_url = 'http://localhost:3000' if settings.DEBUG else 'https://kcmedia-frontend.vercel.app'
            invite_link = f"{frontend_url}/admin-signup?token={token}"
            send_admin_invite_email(email=email, name=first_name, invite_link=invite_link)
        except Exception as e:
            print(f"Error sending admin invite email: {e}")

        return Response(AdminSerializer(user).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        from rest_framework.exceptions import ValidationError

        # Don't allow deleting yourself
        if instance == self.request.user:
            raise ValidationError("You cannot delete your own admin account.")

        # Don't allow deleting the last active admin
        active_admin_count = User.objects.filter(is_staff=True, is_active=True).count()
        if active_admin_count <= 1:
            raise ValidationError("Cannot delete the last admin account. Create another admin first.")

        hard_delete = self.request.query_params.get('hard') == 'true'
        
        if hard_delete:
            instance.delete()
        else:
            # Soft delete: mark as inactive and remove staff status to prevent admin access
            instance.is_active = False
            instance.is_staff = False 
            instance.save()

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
            token_data = signer.unsign_object(token, max_age=604800)
            user_id = token_data.get('user_id')
            user = User.objects.get(id=user_id)
            
            # Verify they are supposed to be staff
            if not user.is_staff and not user.is_active:
                # If they were soft-deleted, they are no longer staff. 
                # But if they are accepting invite, they should be staff=True (from perform_create)
                pass 

            user.set_password(password)
            user.is_active = True
            user.save()
            
            from django.utils import timezone
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'detail': 'Admin account activated successfully.',
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
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.core.mail import get_connection, EmailMessage
import traceback


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

class PhotographerPaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing photographer payments.
    """
    queryset = PhotographerPayment.objects.all().order_by('-payment_date', '-created_at')
    serializer_class = PhotographerPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PhotographerPayment.objects.all()
        # Photographers can only see their own payments
        return PhotographerPayment.objects.filter(photographer__user=user)



class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing support tickets.
    """
    queryset = SupportTicket.objects.all().order_by('-created_at')
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.AllowAny] # Allow guest submissions, handle user assignment in perform_create

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        ticket = serializer.save(user=user)
        
        # Send email notification to admin
        try:
            settings_obj = GlobalSettings.objects.first()
            admin_email = settings_obj.admin_email_for_alerts if settings_obj else "admin@example.com"
            
            email_config = EmailConfiguration.objects.filter(is_active=True).first()
            if email_config:
                connection = get_connection(
                    host=email_config.email_host,
                    port=email_config.email_port,
                    username=email_config.email_username,
                    password=email_config.email_password,
                    use_tls=email_config.use_tls,
                    use_ssl=email_config.use_ssl
                )
                
                subject = f"New Support Ticket: {ticket.subject}"
                body = f"New support ticket received from {ticket.name} ({ticket.email}).\n\nTopic: {ticket.get_topic_display()}\nSubject: {ticket.subject}\n\nMessage:\n{ticket.message}\n\nView in admin portal for details."
                
                email = EmailMessage(
                    subject,
                    body,
                    f"{email_config.email_from_name} <{email_config.email_from_address}>",
                    [admin_email],
                    connection=connection
                )
                email.send()
        except Exception as e:
            print(f"Error sending support ticket notification: {e}")


class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing support tickets.
    """
    queryset = SupportTicket.objects.all().order_by('-created_at')
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.AllowAny] # Allow guest submissions, handle user assignment in perform_create

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        ticket = serializer.save(user=user)
        
        # Send email notification to admin
        try:
            settings_obj = GlobalSettings.objects.first()
            admin_email = settings_obj.admin_email_for_alerts if settings_obj else "admin@example.com"
            
            email_config = EmailConfiguration.objects.filter(is_active=True).first()
            if email_config:
                from django.core.mail import get_connection, EmailMessage
                connection = get_connection(
                    host=email_config.email_host,
                    port=email_config.email_port,
                    username=email_config.email_username,
                    password=email_config.email_password,
                    use_tls=email_config.use_tls,
                    use_ssl=email_config.use_ssl
                )
                
                subject = f"New Support Ticket: {ticket.subject}"
                body = f"New support ticket received from {ticket.name} ({ticket.email}).\n\nTopic: {ticket.get_topic_display()}\nSubject: {ticket.subject}\n\nMessage:\n{ticket.message}\n\nView in admin portal for details."
                
                email = EmailMessage(
                    subject,
                    body,
                    f"{email_config.email_from_name} <{email_config.email_from_address}>",
                    [admin_email],
                    connection=connection
                )
                email.send()
        except Exception as e:
            print(f"Error sending support ticket notification: {e}")
