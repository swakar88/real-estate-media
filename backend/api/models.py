from django.db import models
from django.contrib.auth.models import User
import datetime

class Service(models.Model):
    CATEGORY_CHOICES = [
        ('real_estate', 'Real Estate'),
        ('commercial', 'Commercial & Business'),
        ('add_on', 'Add-On Option'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='real_estate')
    image_url = models.URLField(max_length=500, blank=True, null=True, help_text="Unsplash URL or remote path")
    price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Optional starting price")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class GalleryImage(models.Model):
    CATEGORY_CHOICES = [
        ('interior', 'Interior'),
        ('exterior', 'Exterior'),
        ('twilight', 'Twilight'),
        ('aerial', 'Aerial & Drone'),
        ('commercial', 'Commercial'),
    ]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='interior')
    image_url = models.URLField(max_length=500, help_text="Unsplash URL for remote rendering")
    featured = models.BooleanField(default=False, help_text="Show on the main home page")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} [{self.category}]"


class Package(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True)
    is_popular = models.BooleanField(default=False)
    features = models.JSONField(default=list, help_text="List of feature bullet points (strings)")
    order = models.IntegerField(default=0, help_text="Display order on the booking page")

    class Meta:
        ordering = ['order', 'price']

    def __str__(self):
        return f"{self.name} (${self.price})"


class Photographer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='photographer_profile')
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True)
    profile_image_url = models.URLField(max_length=500, blank=True, null=True, help_text="Unsplash URL or remote path")
    equipment = models.TextField(blank=True, help_text="List of equipment used (e.g. Sony A7IV, RS3 Mini)")
    social_links = models.JSONField(default=dict, blank=True, help_text="Social media handles (e.g. {'instagram': 'user', 'website': 'link'})")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Photographer: {self.user.get_full_name() or self.user.username}"


class PhotographerSlot(models.Model):
    TIME_SLOTS = [
        ('09:00', '9:00 AM'),
        ('11:00', '11:00 AM'),
        ('13:00', '1:00 PM'),
        ('15:00', '3:00 PM'),
        ('17:00', '5:00 PM'),
    ]

    photographer = models.ForeignKey(Photographer, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    time_slot = models.CharField(max_length=10, choices=TIME_SLOTS)
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('photographer', 'date', 'time_slot')
        ordering = ['date', 'time_slot']

    def __str__(self):
        return f"{self.photographer} - {self.date} {self.get_time_slot_display()} ({'Booked' if self.is_booked else 'Available'})"


class BookingRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Confirmation'),
        ('confirmed', 'Confirmed & Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    package_interest = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True)
    property_details = models.TextField()
    
    # New scheduling fields
    shoot_date = models.DateField(null=True, blank=True)
    time_slot = models.CharField(max_length=10, choices=PhotographerSlot.TIME_SLOTS, null=True, blank=True)
    assigned_photographer = models.ForeignKey(Photographer, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_bookings')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking: {self.first_name} {self.last_name} - {self.status}"


class ClientShoot(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled / Upcoming'),
        ('editing', 'In Post-Production'),
        ('delivered', 'Delivered (Ready for Download)'),
        ('archived', 'Archived'),
    ]

    PAYMENT_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
    ]

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shoots')
    property_address = models.CharField(max_length=300)
    shoot_date = models.DateField()
    r2_object_key = models.CharField(max_length=500, blank=True, null=True, help_text="Cloudflare R2 Object Key (e.g. orders/{id}/high-res.zip)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    photographer = models.ForeignKey(Photographer, on_delete=models.SET_NULL, null=True, blank=True, related_name='client_shoots')
    
    # Property Metadata (for realistic listing view)
    beds = models.IntegerField(null=True, blank=True)
    baths = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    sqft = models.IntegerField(null=True, blank=True)
    property_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Listing price of the property")
    
    # Invoicing / Stripe Fields
    amount_due = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Total amount for the shoot")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='unpaid')
    stripe_payment_link = models.URLField(max_length=1000, blank=True, null=True, help_text="Generated Stripe Checkout Session URL")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.property_address} ({self.client.username})"

class SiteMedia(models.Model):
    """
    Stores image and video URLs for the frontend website (Home, About, Services, etc.)
    Allows admins to swap out site assets dynamically without redeploying.
    """
    key = models.CharField(max_length=100, unique=True, help_text="A unique identifier for the frontend component, e.g., 'home_hero_video'")
    title = models.CharField(max_length=200, help_text="A human-readable title for the admin portal")
    url = models.URLField(max_length=1000, help_text="The full URL to the media file (e.g., Unsplash, Cloudinary, S3)")
    media_type = models.CharField(max_length=20, choices=[('image', 'Image'), ('video', 'Video')], default='image')
    description = models.TextField(blank=True, help_text="Optional description of where this is used")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.key})"

class EmailConfiguration(models.Model):
    """
    Stores SMTP settings for the system to send emails.
    """
    title = models.CharField(max_length=100, default="Primary SMTP")
    email_host = models.CharField(max_length=255)
    email_port = models.IntegerField(default=587)
    email_username = models.CharField(max_length=255)
    email_password = models.CharField(max_length=255)
    email_from_address = models.EmailField()
    email_from_name = models.CharField(max_length=255, default="KC Real Estate Media")
    use_tls = models.BooleanField(default=True)
    use_ssl = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, help_text="If active, this configuration will be used for all system emails.")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.email_username})"

    class Meta:
        verbose_name = "Email Configuration"
        verbose_name_plural = "Email Configurations"

class EmailTemplate(models.Model):
    """
    Stores email templates (subject and body) for different triggers.
    """
    slug = models.SlugField(unique=True, help_text="Unique identifier for the template (e.g., 'booking-created')")
    title = models.CharField(max_length=100, help_text="Human readable title")
    subject = models.CharField(max_length=255)
    body = models.TextField(help_text="HTML content with placeholders like {customer_name}")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Email Template"
        verbose_name_plural = "Email Templates"

class MediaItem(models.Model):
    """
    Stores individual media files (photos, videos, tours) for a shoot.
    """
    MEDIA_TYPE_CHOICES = [
        ('photo', 'Photo'),
        ('video', 'Video'),
        ('virtual_tour', 'Virtual Tour'),
    ]
    
    shoot = models.ForeignKey(ClientShoot, on_delete=models.CASCADE, related_name='media_items')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    url = models.URLField(max_length=1000, help_text="Public URL for full size or embedded content")
    watermarked_url = models.URLField(max_length=1000, blank=True, null=True, help_text="URL for watermarked/low-res version")
    gcs_object_key = models.CharField(max_length=500, blank=True, null=True, help_text="Google Cloud Storage object key")
    order = models.IntegerField(default=0, help_text="Sort order for display")
    is_processed = models.BooleanField(default=False, help_text="True if watermarked/compressed version is ready")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.shoot.property_address} - {self.get_media_type_display()} ({self.id})"
