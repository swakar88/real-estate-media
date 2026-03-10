from rest_framework import serializers
from .models import Service, GalleryImage, Package, BookingRequest, ClientShoot, Photographer, PhotographerSlot

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

class ClientShootSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)

    class Meta:
        model = ClientShoot
        fields = '__all__'
        read_only_fields = ['client']


class PhotographerSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

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
