from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import datetime
import random
import string

class UserProfile(models.Model):
    """
    Extends Django's User with a referral code.
    Created automatically when a user registers.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    referral_code = models.CharField(max_length=10, unique=True, blank=True)
    profile_image_url = models.URLField(max_length=1000, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = self._generate_unique_code()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_unique_code():
        chars = string.ascii_uppercase + string.digits
        while True:
            code = 'KC' + ''.join(random.choices(chars, k=6))
            if not UserProfile.objects.filter(referral_code=code).exists():
                return code

    def available_credits(self):
        """Sum of all unused referral credits for this user."""
        from django.db.models import Sum
        total = ReferralCredit.objects.filter(
            client=self.user, is_used=False
        ).aggregate(total=Sum('amount'))['total']
        return total or Decimal('0.00')

    def __str__(self):
        return f"Profile: {self.user.email} (ref: {self.referral_code})"


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
    is_archived = models.BooleanField(default=False)
    share_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=50.00, help_text="Photographer's share percentage (e.g. 70.00 for 70%)")
    total_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stripe_account_id = models.CharField(max_length=100, blank=True, null=True, help_text="Stripe Connected Account ID (Express/Custom)")

    def __str__(self):
        return f"Photographer: {self.user.get_full_name() or self.user.username}"


class PhotographerPayment(models.Model):
    photographer = models.ForeignKey(Photographer, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    reference_number = models.CharField(max_length=100, blank=True, null=True, help_text="Transaction ID or check number")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            # New payment record, update photographer's total_paid
            self.photographer.total_paid += self.amount
            self.photographer.save()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Subtract from total_paid before deleting
        self.photographer.total_paid -= self.amount
        self.photographer.save()
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"Payment of ${self.amount} to {self.photographer} on {self.payment_date}"


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
    
    sqft = models.IntegerField(null=True, blank=True, help_text="Square footage of the property")
    referral_code_used = models.CharField(max_length=10, blank=True, null=True, help_text="Referral code entered by the client at booking")
    referral_source = models.CharField(max_length=255, blank=True, null=True, help_text="How they heard about us or referral email")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    completion_notes = models.TextField(blank=True, null=True, help_text="Reason for manual completion if unpaid")
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

    # Contact Details (New)
    contact_name = models.CharField(max_length=200, blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    
    # Property Metadata (for realistic listing view)
    beds = models.IntegerField(null=True, blank=True)
    baths = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    sqft = models.IntegerField(null=True, blank=True)
    property_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Listing price of the property")
    
    referral_code_used = models.CharField(max_length=10, blank=True, null=True, help_text="Referral code that was applied to this shoot")

    # Invoicing / Stripe Fields
    amount_due = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Total amount for the shoot")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='unpaid')
    stripe_payment_link = models.URLField(max_length=1000, blank=True, null=True, help_text="Generated Stripe Checkout Session URL")
    
    # Photographer Payout tracking
    photographer_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Amount owed to photographer for this shoot")
    photographer_paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Amount already paid to photographer")
    photographer_payment_status = models.CharField(max_length=20, choices=[('unpaid', 'Unpaid'), ('partial', 'Partial'), ('paid', 'Paid')], default='unpaid')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Check if payment_status is changing from unpaid to paid
        old_instance = None
        if self.pk:
            try:
                old_instance = ClientShoot.objects.get(pk=self.pk)
            except ClientShoot.DoesNotExist:
                pass

        # Auto-calculate photographer fee if not set or if amount/photographer changed
        if self.photographer and self.amount_due:
            # Ensure values are Decimals to avoid "can't multiply sequence by non-int" error
            # This can happen if amount_due is passed as a string from the API
            try:
                amount = Decimal(str(self.amount_due))
                share = Decimal(str(self.photographer.share_percentage))
                self.photographer_fee = (amount * share) / Decimal('100')
            except (ValueError, TypeError, ArithmeticError):
                # Fallback to zero if calculation fails
                self.photographer_fee = Decimal('0.00')
        
        # Update photographer payment status based on paid amount
        if self.photographer_paid_amount >= self.photographer_fee and self.photographer_fee > 0:
            self.photographer_payment_status = 'paid'
        elif self.photographer_paid_amount > 0:
            self.photographer_payment_status = 'partial'
        else:
            self.photographer_payment_status = 'unpaid'
            
        # Update photographer's total_earned when payment is confirmed
        if self.payment_status == 'paid' and (not old_instance or old_instance.payment_status != 'paid'):
            if self.photographer:
                self.photographer.total_earned += self.photographer_fee
                self.photographer.save()

            # Issue referral credit to the referrer when this shoot is paid
            # Single-use enforcement: a customer can only benefit a referrer once
            if self.referral_code_used and not ClientShoot.objects.filter(
                client=self.client,
                referral_code_used__isnull=False,
                payment_status='paid'
            ).exclude(pk=self.pk).exists():
                try:
                    referrer_profile = UserProfile.objects.get(referral_code=self.referral_code_used)
                    referrer = referrer_profile.user
                    settings_obj = GlobalSettings.objects.first()
                    reward_amount = settings_obj.referral_reward_amount if settings_obj else Decimal('25.00')

                    referee_email = self.contact_email or (self.client.email if self.client_id else '')
                    referral, created = Referral.objects.get_or_create(
                        referrer=referrer,
                        referee_email=referee_email,
                        defaults={
                            'referee_name': self.contact_name or '',
                            'status': 'completed',
                            'reward_amount': reward_amount,
                        }
                    )
                    if not created and referral.status != 'paid':
                        referral.status = 'completed'
                        referral.save()

                    ReferralCredit.objects.get_or_create(
                        referral=referral,
                        defaults={
                            'client': referrer,
                            'amount': reward_amount,
                            'is_used': False,
                        }
                    )
                except UserProfile.DoesNotExist:
                    pass  # Invalid referral code — silently ignore

        super().save(*args, **kwargs)

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
    url_before = models.URLField(max_length=1000, blank=True, null=True, help_text="Optional 'Before' image for comparison (e.g., for staging or grass edits)")
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
    default_cc = models.EmailField(blank=True, null=True, help_text="Default CC address for all automated emails")
    default_bcc = models.EmailField(blank=True, null=True, help_text="Default BCC address for all automated emails (e.g. admin backup)")
    test_mode = models.BooleanField(default=False, help_text="If enabled, all emails are redirected to test addresses instead of real recipients")
    test_email_admin = models.EmailField(blank=True, null=True, help_text="Test recipient for admin emails")
    test_email_client = models.EmailField(blank=True, null=True, help_text="Test recipient for client emails")
    test_email_photographer = models.EmailField(blank=True, null=True, help_text="Test recipient for photographer emails")
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
    body = models.TextField(help_text="Plain text body with placeholders like {name}")
    cc = models.EmailField(max_length=255, blank=True, null=True, help_text="Template-specific CC address")
    bcc = models.EmailField(max_length=255, blank=True, null=True, help_text="Template-specific BCC address")
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


class GlobalSettings(models.Model):
    site_name = models.CharField(max_length=100, default="KC Real Estate Media")
    site_logo_url = models.URLField(max_length=1000, blank=True, null=True)
    favicon_url = models.URLField(max_length=1000, blank=True, null=True)
    invoice_logo_url = models.URLField(max_length=1000, blank=True, null=True)
    sidebar_logo_url = models.URLField(max_length=1000, blank=True, null=True)
    admin_email_for_alerts = models.EmailField(default="admin@example.com")
    REWARD_TYPE_CHOICES = [
        ('fixed', 'Fixed Amount ($)'),
        ('percentage', 'Percentage (%)'),
    ]
    referral_reward_amount = models.DecimalField(max_digits=10, decimal_places=2, default=25.00, help_text="Default reward amount or percentage")
    referral_reward_type = models.CharField(max_length=20, choices=REWARD_TYPE_CHOICES, default='fixed')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Global Settings"
        verbose_name_plural = "Global Settings"

    def __str__(self):
        return self.site_name


class Referral(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed (Lead Booked)'),
        ('paid', 'Reward Paid'),
    ]
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_made')
    referee_name = models.CharField(max_length=200)
    referee_email = models.EmailField()
    referee_phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reward_amount = models.DecimalField(max_digits=10, decimal_places=2, default=25.00, help_text="Amount to be awarded upon completion")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Referral: {self.referrer.username} -> {self.referee_email}"


class ReferralCredit(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_credits')
    referral = models.OneToOneField(Referral, on_delete=models.CASCADE, related_name='credit_issued')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = "Used" if self.is_used else "Available"
        return f"Credit: ${self.amount} for {self.client.username} ({status})"

class SupportTicket(models.Model):
    TOPIC_CHOICES = [
        ('billing', 'Billing Inquiry'),
        ('technical', 'Technical Issue'),
        ('booking', 'Booking Question'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    name = models.CharField(max_length=200)
    email = models.EmailField()
    topic = models.CharField(max_length=20, choices=TOPIC_CHOICES, default='other')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Support: {self.subject} ({self.email})"

class EmailLog(models.Model):
    """
    Audit log of every outgoing email sent by the system.
    """
    STATUS_CHOICES = [('sent', 'Sent'), ('failed', 'Failed')]

    recipient = models.EmailField()
    cc = models.TextField(blank=True, null=True)
    bcc = models.TextField(blank=True, null=True)
    subject = models.CharField(max_length=500)
    body = models.TextField(blank=True, null=True)
    template_slug = models.CharField(max_length=100, blank=True, null=True)
    trigger_event = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    error_message = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"Email to {self.recipient}: {self.subject} [{self.status}]"


class PhotographerRating(models.Model):
    """
    Stores customer feedback and ratings for photographers.
    """
    photographer = models.ForeignKey(Photographer, on_delete=models.CASCADE, related_name='ratings')
    shoot = models.OneToOneField(ClientShoot, on_delete=models.SET_NULL, null=True, blank=True, related_name='rating')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], help_text="1 to 5 stars")
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating for {self.photographer.user.get_full_name()}: {self.rating} stars"
