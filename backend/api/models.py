from django.db import models
from django.contrib.auth.models import User

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking: {self.first_name} {self.last_name} - {self.status}"


class ClientShoot(models.Model):
    STATUS_CHOICES = [
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
    delivery_link = models.URLField(max_length=500, blank=True, null=True, help_text="Dropbox or Google Drive link")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='editing')
    notes = models.TextField(blank=True)
    
    # Invoicing / Stripe Fields
    amount_due = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Total amount for the shoot")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='unpaid')
    stripe_payment_link = models.URLField(max_length=1000, blank=True, null=True, help_text="Generated Stripe Checkout Session URL")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.property_address} ({self.client.username})"
