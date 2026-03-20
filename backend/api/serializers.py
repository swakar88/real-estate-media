from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Service, GalleryImage, Package, BookingRequest, 
    ClientShoot, Photographer, PhotographerSlot, 
    SiteMedia, EmailConfiguration, EmailTemplate, MediaItem,
    Referral, ReferralCredit, GlobalSettings, PhotographerPayment, SupportTicket, PhotographerRating
)

class PhotographerPaymentSerializer(serializers.ModelSerializer):
    photographer_name = serializers.CharField(source='photographer.user.get_full_name', read_only=True)
    class Meta:
        model = PhotographerPayment
        fields = '__all__'

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class GlobalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSettings
        fields = '__all__'

class ReferralSerializer(serializers.ModelSerializer):
    referrer_name = serializers.CharField(source='referrer.get_full_name', read_only=True)
    class Meta:
        model = Referral
        fields = '__all__'
        read_only_fields = ['referrer', 'created_at']

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'

class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = '__all__'

class BookingRequestSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField()
    photographer_name = serializers.SerializerMethodField()

    class Meta:
        model = BookingRequest
        fields = '__all__'

    def get_photographer_name(self, obj):
        if obj.assigned_photographer and hasattr(obj.assigned_photographer, 'user'):
            return f"{obj.assigned_photographer.user.first_name} {obj.assigned_photographer.user.last_name}"
        return None

    def get_payment_status(self, obj):
        # Dynamically link to ClientShoot payment status
        details = obj.property_details or ""
        shoot = ClientShoot.objects.filter(
            property_address=details[:300],
            contact_email=obj.email
        ).first()
        return shoot.payment_status if shoot else 'unpaid'

class MediaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaItem
        fields = ['id', 'media_type', 'url', 'watermarked_url', 'gcs_object_key', 'is_processed', 'order', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # For private buckets, generate fresh signed URLs for the frontend
        if instance.gcs_object_key:
            try:
                from .utils.r2_utils import generate_presigned_url
                import os
                
                # Sign the main URL
                ret['url'] = generate_presigned_url(instance.gcs_object_key)
                
                # Sign the watermarked URL only if it's already processed
                if instance.is_processed and instance.media_type in ['photo', 'video']:
                    # The watermarked version is stored in orders/shoot_{id}/watermarked/{filename}
                    filename = os.path.basename(instance.gcs_object_key)
                    wm_key = f"orders/shoot_{instance.shoot.id}/watermarked/{filename}"
                    
                    # For extra safety, we could check if watermarked exists, 
                    # but typically is_processed flag is sufficient.
                    ret['watermarked_url'] = generate_presigned_url(wm_key)
                else:
                    ret['watermarked_url'] = None
            except Exception as e:
                # If signing fails, ensure we don't return a broken string
                ret['url'] = None
                ret['watermarked_url'] = None
        return ret

class ClientShootSerializer(serializers.ModelSerializer):
    media_items = MediaItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.username', read_only=True)
    photographer_name = serializers.CharField(source='photographer.user.get_full_name', read_only=True)
    
    class Meta:
        model = ClientShoot
        fields = '__all__'

class PhotographerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Photographer
        fields = ['id', 'user', 'full_name', 'email', 'phone', 'bio', 'profile_image_url', 'share_percentage', 'total_earned', 'is_active', 'stripe_account_id']

class PhotographerSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotographerSlot
        fields = '__all__'

class SiteMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteMedia
        fields = '__all__'

class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = '__all__'

class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['created_at', 'status']

class PhotographerRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotographerRating
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
