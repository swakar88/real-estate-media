from django.contrib import admin
from .models import Service, GalleryImage, Package, BookingRequest, ClientShoot, Photographer, PhotographerSlot

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


@admin.register(Photographer)
class PhotographerAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'is_active')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email')
    list_filter = ('is_active',)


@admin.register(PhotographerSlot)
class PhotographerSlotAdmin(admin.ModelAdmin):
    list_display = ('photographer', 'date', 'time_slot', 'is_booked')
    list_filter = ('date', 'is_booked', 'photographer')
    search_fields = ('photographer__user__username', 'date')
