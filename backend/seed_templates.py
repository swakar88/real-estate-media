import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import EmailTemplate

templates = [
    {
        "slug": "photographer-invite",
        "title": "Photographer Invitation",
        "subject": "Invitation: Join the KC Real Estate Media Team",
        "body": """
            <p>Hi {name},</p>
            <p>You have been invited to join the <strong>KC Real Estate Media</strong> team as a photographer.</p>
            <p>We're excited to have you on board! Please click the button below to accept your invitation, set your password, and access your photographer portal where you can manage your schedule and uploads.</p>
        """
    },
    {
        "slug": "booking-confirmation",
        "title": "Booking Confirmation (Customer)",
        "subject": "Booking Confirmation - KC Real Estate Media",
        "body": """
            <p>Hi {customer_name},</p>
            <p>Your booking request for <strong>{property_address}</strong> has been received and confirmed!</p>
            <p>Our photographer {photographer_name}. We look forward to capturing your property.</p>
        """
    },
    {
        "slug": "new-booking-alert",
        "title": "New Booking Alert (Admin)",
        "subject": "New Booking Received - {property_address}",
        "body": """
            <p>A new booking request has been received and automatically processed.</p>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Property:</strong> {property_address}</li>
                <li><strong>Client:</strong> {customer_name} ({customer_email})</li>
                <li><strong>Package:</strong> {package_name}</li>
                <li><strong>Date:</strong> {shoot_date} at {time_slot}</li>
                <li><strong>Assigned:</strong> {photographer_name}</li>
            </ul>
        """
    },
    {
        "slug": "media-ready",
        "title": "Media Ready Notification",
        "subject": "Your Media is Ready!",
        "body": """
            <p>Great news! The media for <strong>{property_address}</strong> has been processed and is ready.</p>
            <p>You will receive an invoice shortly. Once paid, your download links will be automatically enabled on your dashboard.</p>
        """
    },
    {
        "slug": "invoice-ready",
        "title": "Invoice Notification",
        "subject": "Invoice for Your Recent Shoot - {property_address}",
        "body": """
            <p>The invoice for your recent shoot at <strong>{property_address}</strong> is now ready for payment.</p>
            <p>Please click the button below to complete your payment securely via Stripe. Your media will be available for download immediately after payment.</p>
        """
    },
    {
        "slug": "payment-confirmed",
        "title": "Payment Confirmation",
        "subject": "Payment Receipt & Media Download Link",
        "body": """
            <p>Thank you for your payment!</p>
            <p>Payment for <strong>{property_address}</strong> has been confirmed. You can now access and download all high-resolution media directly from your dashboard.</p>
        """
    }
]

for t_data in templates:
    t, created = EmailTemplate.objects.get_or_create(slug=t_data["slug"], defaults=t_data)
    if created:
        print(f"Created template: {t.title}")
    else:
        print(f"Template already exists: {t.title}")
