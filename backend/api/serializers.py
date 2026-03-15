from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Service, GalleryImage, Package, BookingRequest, 
    ClientShoot, Photographer, PhotographerSlot, 
    SiteMedia, EmailConfiguration, EmailTemplate, MediaItem
)

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'

class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = '__all__'
        extra_kwargs = {
            'email_password': {'write_only': True}
        }

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'

class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = '__all__'

class BookingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRequest
        fields = '__all__'

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
                print(f"Error signing URL in serializer for key {instance.gcs_object_key}: {e}")
                
        return ret

class ClientShootSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    photographer_name = serializers.CharField(source='photographer.user.get_full_name', read_only=True)
    media_items = MediaItemSerializer(many=True, read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientShoot
        fields = [
            'id', 'client', 'client_name', 'property_address', 'shoot_date', 
            'r2_object_key', 'status', 'notes', 'photographer', 'photographer_name',
            'beds', 'baths', 'sqft', 'property_price',
            'amount_due', 'payment_status', 'stripe_payment_link', 'created_at',
            'media_items', 'thumbnail_url'
        ]
        read_only_fields = ['created_at', 'stripe_payment_link']

    def get_thumbnail_url(self, obj):
        # Pick the first processed photo
        first_photo = obj.media_items.filter(media_type='photo', is_processed=True).order_by('order').first()
        if not first_photo:
            # Try video if no photo? User said "first image", so maybe just photos.
            return None
            
        from .utils.r2_utils import generate_presigned_url
        import os
        
        is_paid = obj.payment_status.lower() == 'paid' if obj.payment_status else False
        
        if is_paid:
            return generate_presigned_url(first_photo.gcs_object_key)
        else:
            # Watermarked URL
            filename = os.path.basename(first_photo.gcs_object_key)
            wm_key = f"orders/shoot_{obj.id}/watermarked/{filename}"
            return generate_presigned_url(wm_key)


class PhotographerSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role = serializers.CharField(source='bio', read_only=True) # Map bio to role for frontend

    class Meta:
        model = Photographer
        fields = '__all__'
        read_only_fields = ['user']


class PhotographerSlotSerializer(serializers.ModelSerializer):
    photographer_name = serializers.CharField(source='photographer.user.get_full_name', read_only=True)

    class Meta:
        model = PhotographerSlot
        fields = '__all__'
        read_only_fields = ['photographer']

class SiteMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteMedia
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    booking_count = serializers.IntegerField(read_only=True)
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'booking_count', 'last_login', 'date_joined']
