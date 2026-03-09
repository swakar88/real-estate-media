from django.contrib import admin
from .models import Service, GalleryImage, Package, BookingRequest, ClientShoot

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'price', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('title', 'description')

@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'featured', 'created_at')
    list_filter = ('category', 'featured')
    search_fields = ('title',)

@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'is_popular', 'order')
    list_editable = ('price', 'is_popular', 'order')

@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'package_interest', 'status', 'created_at')
    list_filter = ('status', 'package_interest')
    search_fields = ('first_name', 'last_name', 'email', 'phone')

@admin.register(ClientShoot)
class ClientShootAdmin(admin.ModelAdmin):
    list_display = ('property_address', 'client', 'shoot_date', 'status')
    list_filter = ('status', 'shoot_date')
    search_fields = ('property_address', 'client__username', 'client__email')
