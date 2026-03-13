import os
import resend
from django.conf import settings

def _get_email_template(title, content_html, button_text=None, button_url=None):
    """
    Returns a consistent, professional HTML layout for all system emails.
    """
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

def send_photographer_invite_email(email, name, invite_link):
    """
    Send an email invitation to a new photographer using the Resend API.
    """
    resend.api_key = os.environ.get('RESEND_API_KEY')
    if not resend.api_key:
        print("Warning: RESEND_API_KEY is not set. Email not sent.")
        return False

    from_email = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')

    content_html = f"""
        <p>Hi {name},</p>
        <p>You have been invited to join the <strong>KC Real Estate Media</strong> team as a photographer.</p>
        <p>We're excited to have you on board! Please click the button below to accept your invitation, set your password, and access your photographer portal where you can manage your schedule and uploads.</p>
    """
    
    html_content = _get_email_template(
        "Welcome to the Team",
        content_html,
        "Accept Invitation & Set Password",
        invite_link
    )

    try:
        response = resend.Emails.send({
            "from": from_email,
            "to": email,
            "subject": "Invitation: Join the KC Real Estate Media Team",
            "html": html_content
        })
        print(f"Invite email sent successfully to {email}. Resend ID: {response.get('id')}")
        return True
    except Exception as e:
        print(f"Failed to send invite email to {email}: {e}")
        return False

def _send_mocked_email(subject, html_content):
    resend.api_key = os.environ.get('RESEND_API_KEY')
    if not resend.api_key:
        print("Warning: RESEND_API_KEY is not set. Email not sent.")
        return False
    from_email = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')
    to_email = "swakar88@gmail.com" # MOCKED FOR TESTING

    try:
        response = resend.Emails.send({
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html_content
        })
        print(f"Email '{subject}' sent successfully to {to_email}. Resend ID: {response.get('id')}")
        return True
    except Exception as e:
        print(f"Failed to send email '{subject}' to {to_email}: {e}")
        return False

def send_booking_created_emails(booking, customer_email, photographer_email, photographer_name):
    # Admin
    admin_content = f"""
        <p>A new booking request has been received and automatically processed.</p>
        <ul style="list-style: none; padding: 0;">
            <li><strong>Property:</strong> {booking.property_details}</li>
            <li><strong>Client:</strong> {booking.first_name} {booking.last_name} ({booking.email})</li>
            <li><strong>Package:</strong> {booking.package_interest}</li>
            <li><strong>Date:</strong> {booking.shoot_date} at {booking.time_slot}</li>
            <li><strong>Assigned:</strong> {photographer_name or 'Unassigned'}</li>
        </ul>
    """
    _send_mocked_email(
        subject=f"New Booking Received - {booking.property_details[:50]}",
        html_content=_get_email_template("New Booking Alert", admin_content)
    )

    # Customer
    customer_content = f"""
        <p>Hi {booking.first_name},</p>
        <p>Your booking request for <strong>{booking.property_details[:100]}</strong> has been received and confirmed!</p>
        <p>Our photographer {photographer_name or 'will be assigned shortly'}. We look forward to capturing your property.</p>
    """
    _send_mocked_email(
        subject="Booking Confirmation - KC Real Estate Media",
        html_content=_get_email_template("Booking Confirmed", customer_content)
    )

    # Photographer
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
    # Admin
    admin_content = f"<p>Media has been uploaded for the property at <strong>{shoot_address}</strong>. It is now ready for client delivery.</p>"
    _send_mocked_email(
        subject=f"Shoot Media Uploaded - {shoot_address[:50]}",
        html_content=_get_email_template("Media Uploaded", admin_content)
    )

    # Customer
    customer_content = f"""
        <p>Great news! The media for <strong>{shoot_address}</strong> has been processed and is ready.</p>
        <p>You will receive an invoice shortly. Once paid, your download links will be automatically enabled on your dashboard.</p>
    """
    _send_mocked_email(
        subject="Your Media is Ready!",
        html_content=_get_email_template("Processing Complete", customer_content)
    )

def send_invoice_generated_email(shoot_address, payment_link):
    # Customer
    content = f"""
        <p>The invoice for your recent shoot at <strong>{shoot_address}</strong> is now ready for payment.</p>
        <p>Please click the button below to complete your payment securely via Stripe. Your media will be available for download immediately after payment.</p>
    """
    _send_mocked_email(
        subject=f"Invoice for Your Recent Shoot - {shoot_address[:50]}",
        html_content=_get_email_template("Invoice Ready", content, "Pay Securely via Stripe", payment_link)
    )

def send_payment_confirmed_emails(shoot_address, dashboard_link):
    # Admin
    admin_content = f"<p>Payment has been successfully received for <strong>{shoot_address}</strong>. Media access has been granted to the client.</p>"
    _send_mocked_email(
        subject=f"Payment Received - {shoot_address[:50]}",
        html_content=_get_email_template("Payment Captured", admin_content)
    )

    # Customer
    customer_content = f"""
        <p>Thank you for your payment!</p>
        <p>Payment for <strong>{shoot_address}</strong> has been confirmed. You can now access and download all high-resolution media directly from your dashboard.</p>
    """
    _send_mocked_email(
        subject="Payment Receipt & Media Download Link",
        html_content=_get_email_template("Payment Successful", customer_content, "Go to Dashboard", dashboard_link)
    )
