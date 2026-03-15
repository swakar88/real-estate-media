import os
import resend
from django.conf import settings
from django.core.mail import get_connection, EmailMessage
from api.models import EmailConfiguration, EmailTemplate
import re

def get_email_connection():
    """
    Returns a configured SMTP connection if an active EmailConfiguration exists.
    Otherwise returns None.
    """
    try:
        config = EmailConfiguration.objects.filter(is_active=True).first()
        if config:
            return get_connection(
                host=config.email_host,
                port=config.email_port,
                username=config.email_username,
                password=config.email_password,
                use_tls=config.use_tls,
                use_ssl=config.use_ssl
            ), config
    except Exception as e:
        print(f"Error fetching email configuration: {e}")
    return None, None

def _get_email_template(title, content_html, button_text=None, button_url=None):
    # (Remains the same as before)
    button_html = ""
    if button_text and button_url:
        button_html = f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{button_url}" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">{button_text}</a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 20px auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 12px; }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .logo {{ font-size: 24px; font-weight: bold; letter-spacing: -1px; color: #000; text-transform: uppercase; }}
            .content {{ font-size: 16px; color: #444; }}
            .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #999; text-align: center; }}
            h1 {{ font-size: 22px; font-weight: 800; margin-bottom: 20px; color: #1a1a1a; }}
            p {{ margin-bottom: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">KC REAL ESTATE MEDIA</div>
            </div>
            <div class="content">
                <h1>{title}</h1>
                {content_html}
                {button_html}
            </div>
            <div class="footer">
                &copy; 2026 KC Real Estate Media. All rights reserved.<br>
                Professional Media Solutions for Modern Real Estate.
            </div>
        </div>
    </body>
    </html>
    """

def send_email_dynamic(subject, recipient_email, html_content, from_email=None, from_name=None):
    """
    Sends an email using either the configured SMTP backend or Resend as a fallback.
    """
    connection, config = get_email_connection()
    
    if connection:
        try:
            email_from = f"{from_name or config.email_from_name} <{from_email or config.email_from_address}>"
            email = EmailMessage(
                subject,
                html_content,
                email_from,
                [recipient_email],
                connection=connection
            )
            email.content_subtype = "html"
            email.send()
            print(f"Email '{subject}' sent successfully to {recipient_email} via SMTP.")
            return True
        except Exception as e:
            print(f"Failed to send email via SMTP: {e}. Falling back to Resend...")

    # Fallback to Resend
    resend.api_key = os.environ.get('RESEND_API_KEY')
    if not resend.api_key:
        print("Warning: Neither SMTP nor Resend is configured. Email not sent.")
        return False

    resend_from = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')
    try:
        response = resend.Emails.send({
            "from": resend_from,
            "to": recipient_email,
            "subject": subject,
            "html": html_content
        })
        print(f"Email '{subject}' sent successfully to {recipient_email} via Resend. Resend ID: {response.get('id')}")
        return True
    except Exception as e:
        print(f"Failed to send email via Resend: {e}")
        return False

def _render_template(body, context):
    """
    Replaces {variable} placeholders in the body with context values.
    """
    for key, value in context.items():
        body = body.replace(f"{{{key}}}", str(value))
    return body

def get_template_content(slug, default_subject, default_body, context=None):
    """
    Fetches a template from the database and renders it with context.
    Returns (subject, rendered_body).
    """
    try:
        template = EmailTemplate.objects.filter(slug=slug).first()
        if template:
            subject = _render_template(template.subject, context or {})
            body = _render_template(template.body, context or {})
            return subject, body
    except Exception as e:
        print(f"Error fetching template {slug}: {e}")
    
    return default_subject, _render_template(default_body, context or {})

def send_photographer_invite_email(email, name, invite_link):
    default_body = """
        <p>Hi {name},</p>
        <p>You have been invited to join the <strong>KC Real Estate Media</strong> team as a photographer.</p>
        <p>We're excited to have you on board! Please click the button below to accept your invitation, set your password, and access your photographer portal where you can manage your schedule and uploads.</p>
    """
    subject, content_html = get_template_content(
        "photographer-invite", 
        "Invitation: Join the KC Real Estate Media Team", 
        default_body, 
        {"name": name}
    )
    html_content = _get_email_template("Welcome to the Team", content_html, "Accept Invitation & Set Password", invite_link)
    return send_email_dynamic(subject, email, html_content)

def _send_mocked_email(subject, html_content):
    # Keep the "mocked" behavior for now as per project context, 
    # but use the dynamic sender.
    to_email = "swakar88@gmail.com" # MOCKED FOR TESTING
    return send_email_dynamic(subject, to_email, html_content)

def send_booking_created_emails(booking, customer_email, photographer_email, photographer_name):
    context = {
        "property_address": booking.property_details,
        "customer_name": f"{booking.first_name} {booking.last_name}",
        "customer_email": booking.email,
        "package_name": booking.package_interest,
        "shoot_date": booking.shoot_date,
        "time_slot": booking.time_slot,
        "photographer_name": photographer_name or 'Unassigned'
    }

    # Admin Alert
    admin_subject, admin_content = get_template_content(
        "new-booking-alert",
        f"New Booking Received - {booking.property_details[:50]}",
        """
        <p>A new booking request has been received and automatically processed.</p>
        <ul style="list-style: none; padding: 0;">
            <li><strong>Property:</strong> {property_address}</li>
            <li><strong>Client:</strong> {customer_name} ({customer_email})</li>
            <li><strong>Package:</strong> {package_name}</li>
            <li><strong>Date:</strong> {shoot_date} at {time_slot}</li>
            <li><strong>Assigned:</strong> {photographer_name}</li>
        </ul>
        """,
        context
    )
    _send_mocked_email(
        subject=admin_subject,
        html_content=_get_email_template("New Booking Alert", admin_content)
    )

    # Customer Confirmation
    cust_subject, cust_content = get_template_content(
        "booking-confirmation",
        "Booking Confirmation - KC Real Estate Media",
        """
        <p>Hi {customer_name},</p>
        <p>Your booking request for <strong>{property_address}</strong> has been received and confirmed!</p>
        <p>Our photographer {photographer_name}. We look forward to capturing your property.</p>
        """,
        context
    )
    _send_mocked_email(
        subject=cust_subject,
        html_content=_get_email_template("Booking Confirmed", cust_content)
    )

    # Photographer Notification
    if photographer_email:
        photog_content = f"""
            <p>Hi {photographer_name},</p>
            <p>A new shoot has been assigned to you.</p>
            <p><strong>Property:</strong> {booking.property_details}</p>
            <p><strong>Scheduled:</strong> {booking.shoot_date} at {booking.time_slot}</p>
            <p>Please log in to your portal to view more details and upload media once the shoot is complete.</p>
        """
        _send_mocked_email(
            subject=f"New Shoot Assigned - {booking.shoot_date}",
            html_content=_get_email_template("New Shoot Assigned", photog_content)
        )

def send_content_uploaded_emails(shoot_address):
    admin_content = f"<p>Media has been uploaded for the property at <strong>{shoot_address}</strong>. It is now ready for client delivery.</p>"
    _send_mocked_email(
        subject=f"Shoot Media Uploaded - {shoot_address[:50]}",
        html_content=_get_email_template("Media Uploaded", admin_content)
    )

    # Customer notification
    subject, content_html = get_template_content(
        "media-ready",
        "Your Media is Ready!",
        """
        <p>Great news! The media for <strong>{property_address}</strong> has been processed and is ready.</p>
        <p>You will receive an invoice shortly. Once paid, your download links will be automatically enabled on your dashboard.</p>
        """,
        {"property_address": shoot_address}
    )
    _send_mocked_email(
        subject=subject,
        html_content=_get_email_template("Processing Complete", content_html)
    )

def send_invoice_generated_email(shoot_address, payment_link):
    subject, content_html = get_template_content(
        "invoice-ready",
        f"Invoice for Your Recent Shoot - {shoot_address[:50]}",
        """
        <p>The invoice for your recent shoot at <strong>{property_address}</strong> is now ready for payment.</p>
        <p>Please click the button below to complete your payment securely via Stripe. Your media will be available for download immediately after payment.</p>
        """,
        {"property_address": shoot_address}
    )
    _send_mocked_email(
        subject=subject,
        html_content=_get_email_template("Invoice Ready", content_html, "Pay Securely via Stripe", payment_link)
    )

def send_payment_confirmed_emails(shoot_address, dashboard_link):
    admin_content = f"<p>Payment has been successfully received for <strong>{shoot_address}</strong>. Media access has been granted to the client.</p>"
    _send_mocked_email(
        subject=f"Payment Received - {shoot_address[:50]}",
        html_content=_get_email_template("Payment Captured", admin_content)
    )

    # Customer notification
    subject, content_html = get_template_content(
        "payment-confirmed",
        "Payment Receipt & Media Download Link",
        """
        <p>Thank you for your payment!</p>
        <p>Payment for <strong>{property_address}</strong> has been confirmed. You can now access and download all high-resolution media directly from your dashboard.</p>
        """,
        {"property_address": shoot_address}
    )
    _send_mocked_email(
        subject=subject,
        html_content=_get_email_template("Payment Successful", content_html, "Go to Dashboard", dashboard_link)
    )
