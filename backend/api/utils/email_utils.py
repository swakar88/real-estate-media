import os
import resend
from django.conf import settings
from django.core.mail import get_connection, EmailMessage
from api.models import EmailConfiguration, EmailTemplate
import re

def _log_email(recipient, subject, body=None, cc=None, bcc=None, template_slug=None, trigger_event=None, status='sent', error_message=None):
    """Persist an email audit record. Silently swallows any DB errors."""
    try:
        from api.models import EmailLog
        EmailLog.objects.create(
            recipient=recipient,
            subject=subject,
            body=body or '',
            cc=', '.join(cc) if isinstance(cc, list) else (cc or ''),
            bcc=', '.join(bcc) if isinstance(bcc, list) else (bcc or ''),
            template_slug=template_slug or '',
            trigger_event=trigger_event or '',
            status=status,
            error_message=error_message or '',
        )
    except Exception as e:
        print(f"EmailLog write failed (non-critical): {e}")


def _smtp_reachable(host, port, timeout=3):
    """Quick socket probe to check if SMTP port is reachable before attempting a full connection."""
    import socket
    try:
        sock = socket.create_connection((host, int(port)), timeout=timeout)
        sock.close()
        return True
    except (OSError, socket.timeout):
        return False


def get_email_connection():
    """
    Returns a configured SMTP connection if an active EmailConfiguration exists
    and the SMTP host is reachable. Otherwise returns None so callers fall back to Resend.
    """
    try:
        config = EmailConfiguration.objects.filter(is_active=True).first()
        if config:
            if not _smtp_reachable(config.email_host, config.email_port):
                print(f"SMTP {config.email_host}:{config.email_port} unreachable — skipping SMTP, will use Resend.")
                return None, config
            return get_connection(
                host=config.email_host,
                port=config.email_port,
                username=config.email_username,
                password=config.email_password,
                use_tls=config.use_tls,
                use_ssl=config.use_ssl,
                timeout=10,
            ), config
    except Exception as e:
        print(f"Error fetching email configuration: {e}")
    return None, None

def _get_email_template(title, content_html, button_text=None, button_url=None):
    from api.models import GlobalSettings
    settings = GlobalSettings.objects.first()
    logo_url = settings.site_logo_url if settings else None
    
    logo_html = ""
    if logo_url:
        logo_html = f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{logo_url}" alt="Logo" style="max-height: 60px; width: auto;">
        </div>
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
    </head>
    <body style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">{title}</div>
            <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
                {content_html}
            </div>
            {button_html}
            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #555;">
                Best regards,
                KC Real Estate Media Team
            </div>
        </div>
    </body>
    </html>
    """

def _resolve_test_recipient(config, recipient_email, recipient_type):
    """If test_mode is on, return the appropriate test address; otherwise return recipient_email."""
    if not (config and config.test_mode):
        return recipient_email
    if recipient_type == 'admin':
        return config.test_email_admin or recipient_email
    if recipient_type == 'photographer':
        return config.test_email_photographer or recipient_email
    return config.test_email_client or recipient_email  # default: client


def send_email_with_attachment(subject, recipient_email, html_content, attachment_bytes, attachment_filename, attachment_mime=('text', 'calendar'), from_email=None, from_name=None, cc=None, bcc=None, recipient_type='client'):
    """
    Sends an HTML email with a single binary attachment via SMTP.
    Falls back to send_email_dynamic (no attachment) if SMTP is unavailable.
    """
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders

    connection, config = get_email_connection()
    if not connection:
        # No SMTP — send without attachment via fallback
        return send_email_dynamic(subject, recipient_email, html_content, from_email, from_name, cc, bcc, recipient_type=recipient_type)

    actual_recipient = _resolve_test_recipient(config, recipient_email, recipient_type)

    cc_list = [cc] if cc and isinstance(cc, str) else (cc or [])
    bcc_list = [bcc] if bcc and isinstance(bcc, str) else (bcc or [])
    if config:
        if config.default_cc and config.default_cc not in cc_list:
            cc_list.append(config.default_cc)
        if config.default_bcc and config.default_bcc not in bcc_list:
            bcc_list.append(config.default_bcc)

    try:
        email_from = f"{from_name or config.email_from_name} <{from_email or config.email_from_address}>"
        msg = EmailMessage(
            subject,
            html_content,
            email_from,
            [actual_recipient],
            cc=cc_list,
            bcc=bcc_list,
            connection=connection,
        )
        msg.content_subtype = 'html'

        # Attach the file
        part = MIMEBase(*attachment_mime)
        part.set_payload(attachment_bytes)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', 'attachment', filename=attachment_filename)
        msg.attach(part)

        msg.send()
        print(f"Email '{subject}' with attachment sent to {actual_recipient}.")
        _log_email(actual_recipient, subject, body=html_content, cc=cc_list, bcc=bcc_list, status='sent')
        return True
    except Exception as e:
        print(f"Failed to send email with attachment: {e}")
        _log_email(actual_recipient, subject, body=html_content, cc=cc_list, bcc=bcc_list, status='failed', error_message=str(e))
        return False


def send_booking_calendar_invite(booking, client_email, photographer_email=None, method='REQUEST', sequence=0):
    """
    Sends iCal calendar invite(s) to the client (and optionally photographer).
    booking: BookingRequest instance
    method:  'REQUEST' (create/update) | 'CANCEL'
    sequence: increment on each update/cancel so email clients recognise the change
    """
    from .ical_utils import generate_ical

    if not booking.shoot_date or not booking.time_slot:
        return  # Nothing to invite to

    site_settings = None
    try:
        from api.models import GlobalSettings
        site_settings = GlobalSettings.objects.first()
    except Exception:
        pass

    organizer_email = 'noreply@kcrealestate.com'
    organizer_name = site_settings.site_name if site_settings else 'KC Real Estate Media'

    summary = f"Property Shoot — {booking.property_details[:60]}"
    location = booking.property_details[:200]
    package_name = str(booking.package_interest) if booking.package_interest else 'N/A'
    description = (
        f"KC Real Estate Media Shoot\n"
        f"Package: {package_name}\n"
        f"Date: {booking.shoot_date}\n"
        f"Time: {booking.time_slot} CT\n"
        f"Address: {booking.property_details}"
    )

    # Use a stable UID tied to the booking so updates/cancels target the same event
    uid = f"booking-{booking.id}@kcrealestate.com"

    action_label = "Cancellation" if method == 'CANCEL' else "Confirmation"
    subject = f"Shoot {action_label} — {booking.property_details[:50]}"

    # Client invite
    ical_bytes = generate_ical(
        uid=uid,
        summary=summary,
        location=location,
        description=description,
        shoot_date=booking.shoot_date,
        time_slot=booking.time_slot,
        method=method,
        sequence=sequence,
        organizer_email=organizer_email,
        organizer_name=organizer_name,
        attendee_email=client_email,
    )
    client_body = (
        f"Your shoot at {booking.property_details[:60]} has been {action_label.lower()}d.\n\n"
        f"Date: {booking.shoot_date} at {booking.time_slot} CT.\n\n"
        f"The calendar invite is attached. Please add it to your calendar."
    )
    send_email_with_attachment(
        subject=subject,
        recipient_email=client_email,
        html_content=_get_email_template(f"Shoot {action_label}", client_body),
        attachment_bytes=ical_bytes,
        attachment_filename='invite.ics',
        attachment_mime=('text', 'calendar'),
        recipient_type='client',
    )

    # Photographer invite
    if photographer_email:
        phot_ical_bytes = generate_ical(
            uid=uid,
            summary=summary,
            location=location,
            description=description,
            shoot_date=booking.shoot_date,
            time_slot=booking.time_slot,
            method=method,
            sequence=sequence,
            organizer_email=organizer_email,
            organizer_name=organizer_name,
            attendee_email=photographer_email,
        )
        phot_body = (
            f"A shoot has been {'cancelled' if method == 'CANCEL' else 'assigned to you'}.\n\n"
            f"Property: {booking.property_details[:60]}\n"
            f"Date: {booking.shoot_date} at {booking.time_slot} CT.\n\n"
            f"The calendar invite is attached."
        )
        send_email_with_attachment(
            subject=subject,
            recipient_email=photographer_email,
            html_content=_get_email_template(f"Shoot {action_label}", phot_body),
            attachment_bytes=phot_ical_bytes,
            attachment_filename='invite.ics',
            attachment_mime=('text', 'calendar'),
            recipient_type='photographer',
        )


def send_email_dynamic(subject, recipient_email, html_content, from_email=None, from_name=None, cc=None, bcc=None, recipient_type='client'):
    """
    Sends an email using either the configured SMTP backend or Resend as a fallback.
    recipient_type: 'admin' | 'client' | 'photographer' — used for test mode redirection.
    """
    connection, config = get_email_connection()

    actual_recipient = _resolve_test_recipient(config, recipient_email, recipient_type)

    # Process cc and bcc to ensure they are lists
    cc_list = [cc] if cc and isinstance(cc, str) else (cc or [])
    bcc_list = [bcc] if bcc and isinstance(bcc, str) else (bcc or [])

    # Merge with global defaults if config exists
    if config:
        if hasattr(config, 'default_cc') and config.default_cc:
            if config.default_cc not in cc_list:
                cc_list.append(config.default_cc)
        if hasattr(config, 'default_bcc') and config.default_bcc:
            if config.default_bcc not in bcc_list:
                bcc_list.append(config.default_bcc)

    if connection:
        try:
            email_from = f"{from_name or config.email_from_name} <{from_email or config.email_from_address}>"
            email = EmailMessage(
                subject,
                html_content,
                email_from,
                [actual_recipient],
                cc=cc_list,
                bcc=bcc_list,
                connection=connection
            )
            email.content_subtype = "html"
            email.send()
            print(f"Email '{subject}' sent successfully to {actual_recipient} via SMTP.")
            _log_email(actual_recipient, subject, body=html_content, cc=cc_list, bcc=bcc_list, status='sent')
            return True
        except Exception as e:
            print(f"Failed to send email via SMTP: {e}. Falling back to Resend...")
            _log_email(actual_recipient, subject, body=html_content, cc=cc_list, bcc=bcc_list, status='failed', error_message=str(e))

    # Fallback to Resend
    resend.api_key = os.environ.get('RESEND_API_KEY')
    if not resend.api_key:
        print("Warning: Neither SMTP nor Resend is configured. Email not sent.")
        return False

    resend_from = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')
    try:
        params: dict = {
            "from": resend_from,
            "to": [actual_recipient] if isinstance(actual_recipient, str) else actual_recipient,
            "subject": subject,
            "html": html_content,
        }
        if cc_list:
            params["cc"] = cc_list
        if bcc_list:
            params["bcc"] = bcc_list
        response = resend.Emails.send(params)
        resend_id = response.id if hasattr(response, 'id') else response.get('id', 'unknown')
        print(f"Email '{subject}' sent successfully to {actual_recipient} via Resend. Resend ID: {resend_id}")
        _log_email(actual_recipient, subject, body=html_content, cc=cc_list, bcc=bcc_list, status='sent')
        return True
    except Exception as e:
        print(f"Failed to send email via Resend: {e}")
        _log_email(actual_recipient, subject, body=html_content, cc=cc_list, bcc=bcc_list, status='failed', error_message=str(e))
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
    Returns (subject, rendered_body, cc, bcc).
    """
    cc = None
    bcc = None
    try:
        template = EmailTemplate.objects.filter(slug=slug).first()
        if template:
            subject = _render_template(template.subject, context or {})
            body = _render_template(template.body, context or {})
            return subject, body, template.cc, template.bcc
    except Exception as e:
        print(f"Error fetching template {slug}: {e}")
    
    return default_subject, _render_template(default_body, context or {}), cc, bcc

def send_photographer_invite_email(email, name, invite_link):
    default_body = """Hi {name},

You have been invited to join the KC Real Estate Media team as a photographer.

We're excited to have you on board! Please click the button below to accept your invitation, set your password, and access your photographer portal where you can manage your schedule and uploads.
    """
    subject, content_html, t_cc, t_bcc = get_template_content(
        "photographer-invite", 
        "Invitation: Join the KC Real Estate Media Team", 
        default_body, 
        {"name": name}
    )
    html_content = _get_email_template("Welcome to the Team", content_html, "Accept Invitation & Set Password", invite_link)
    return send_email_dynamic(subject, email, html_content, cc=t_cc, bcc=t_bcc)

def send_admin_invite_email(email, name, invite_link):
    default_body = """Hi {name},

You have been invited to join the KC Real Estate Media administrative team.

As an administrator, you will have access to manage bookings, services, media, and team members. Please click the button below to accept your invitation, set your password, and access the admin portal.
    """
    subject, content_html, t_cc, t_bcc = get_template_content(
        "admin-invite", 
        "Welcome to the Admin Team - KC Real Estate Media", 
        default_body, 
        {"name": name}
    )
    html_content = _get_email_template("Admin Invitation", content_html, "Accept Invitation & Activate Account", invite_link)
    return send_email_dynamic(subject, email, html_content, cc=t_cc, bcc=t_bcc)

def _send_mocked_email(subject, html_content, to_email=None, cc=None, bcc=None, recipient_type='client'):
    recipient = to_email or "swakar88@gmail.com"
    return send_email_dynamic(subject, recipient, html_content, cc=cc, bcc=bcc, recipient_type=recipient_type)

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
    admin_subject, admin_content, a_cc, a_bcc = get_template_content(
        "new-booking-alert",
        f"New Booking Received - {booking.property_details[:50]}",
        """A new booking request has been received and automatically processed.

Property: {property_address}
Client: {customer_name} ({customer_email})
Package: {package_name}
Date: {shoot_date} at {time_slot}
Assigned: {photographer_name}""",
        context
    )
    _send_mocked_email(
        subject=admin_subject,
        html_content=_get_email_template("New Booking Alert", admin_content),
        to_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else "admin@example.com",
        cc=a_cc,
        bcc=a_bcc,
        recipient_type='admin',
    )

    # Customer Confirmation
    cust_subject, cust_content, c_cc, c_bcc = get_template_content(
        "booking-confirmation",
        "Booking Confirmation - KC Real Estate Media",
        """Hi {customer_name},

Your booking request for {property_address} has been received and confirmed!

Our photographer {photographer_name}. We look forward to capturing your property.""",
        context
    )
    _send_mocked_email(
        subject=cust_subject,
        html_content=_get_email_template("Booking Confirmed", cust_content),
        to_email=customer_email,
        cc=c_cc,
        bcc=c_bcc,
        recipient_type='client',
    )

    # Photographer Notification
    if photographer_email:
        photog_content = f"""Hi {photographer_name},

A new shoot has been assigned to you.

Property: {booking.property_details}
Scheduled: {booking.shoot_date} at {booking.time_slot}

Please log in to your portal to view more details and upload media once the shoot is complete."""
        _send_mocked_email(
            subject=f"New Shoot Assigned - {booking.shoot_date}",
            html_content=_get_email_template("New Shoot Assigned", photog_content),
            to_email=photographer_email,
            recipient_type='photographer',
        )

    # Calendar invites — attach .ics to both parties
    try:
        send_booking_calendar_invite(
            booking=booking,
            client_email=customer_email,
            photographer_email=photographer_email,
            method='REQUEST',
            sequence=0,
        )
    except Exception as e:
        print(f"Calendar invite failed: {e}")

def send_clientshoot_calendar_invite(shoot, method='REQUEST', sequence=0):
    """
    Sends iCal calendar invite(s) for a ClientShoot reschedule or cancellation.
    shoot: ClientShoot instance
    """
    from .ical_utils import generate_ical

    client_email = shoot.contact_email or (shoot.client.email if shoot.client else None)
    if not client_email:
        return

    site_settings = None
    try:
        from api.models import GlobalSettings
        site_settings = GlobalSettings.objects.first()
    except Exception:
        pass

    organizer_email = 'noreply@kcrealestate.com'
    organizer_name = site_settings.site_name if site_settings else 'KC Real Estate Media'

    time_slot = getattr(shoot, 'time_slot', '09:00') or '09:00'
    summary = f"Property Shoot — {shoot.property_address[:60]}"
    location = shoot.property_address[:200]
    description = (
        f"KC Real Estate Media Shoot\n"
        f"Date: {shoot.shoot_date}\n"
        f"Address: {shoot.property_address}"
    )
    uid = f"shoot-{shoot.id}@kcrealestate.com"
    action_label = "Cancellation" if method == 'CANCEL' else "Update"
    subject = f"Shoot {action_label} — {shoot.property_address[:50]}"

    ical_bytes = generate_ical(
        uid=uid, summary=summary, location=location, description=description,
        shoot_date=shoot.shoot_date, time_slot=time_slot,
        method=method, sequence=sequence,
        organizer_email=organizer_email, organizer_name=organizer_name,
        attendee_email=client_email,
    )
    client_body = (
        f"Your shoot at {shoot.property_address[:60]} has been {'updated' if method == 'REQUEST' else 'cancelled'}.\n\n"
        f"Date: {shoot.shoot_date} at {time_slot} CT.\n\n"
        f"Please update your calendar accordingly."
    )
    send_email_with_attachment(
        subject=subject, recipient_email=client_email,
        html_content=_get_email_template(f"Shoot {action_label}", client_body),
        attachment_bytes=ical_bytes, attachment_filename='invite.ics',
        attachment_mime=('text', 'calendar'),
        recipient_type='client',
    )

    # Photographer invite
    try:
        if shoot.photographer and shoot.photographer.user:
            phot_email = shoot.photographer.user.email
            phot_ical_bytes = generate_ical(
                uid=uid, summary=summary, location=location, description=description,
                shoot_date=shoot.shoot_date, time_slot=time_slot,
                method=method, sequence=sequence,
                organizer_email=organizer_email, organizer_name=organizer_name,
                attendee_email=phot_email,
            )
            phot_body = (
                f"A shoot you're assigned to has been {'updated' if method == 'REQUEST' else 'cancelled'}.\n\n"
                f"Property: {shoot.property_address[:60]}\n"
                f"Date: {shoot.shoot_date} at {time_slot} CT."
            )
            send_email_with_attachment(
                subject=subject, recipient_email=phot_email,
                html_content=_get_email_template(f"Shoot {action_label}", phot_body),
                attachment_bytes=phot_ical_bytes, attachment_filename='invite.ics',
                attachment_mime=('text', 'calendar'),
                recipient_type='photographer',
            )
    except Exception as e:
        print(f"Photographer calendar invite failed: {e}")


def send_content_uploaded_emails(shoot_address, to_email=None):
    admin_content = f"Media has been uploaded for the property at {shoot_address}. It is now ready for client delivery."
    _send_mocked_email(
        subject=f"Shoot Media Uploaded - {shoot_address[:50]}",
        html_content=_get_email_template("Media Uploaded", admin_content),
        to_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else "admin@example.com",
        recipient_type='admin',
    )

    # Customer notification
    subject, content_html, m_cc, m_bcc = get_template_content(
        "media-ready",
        "Your Media is Ready!",
        """Great news! The media for {property_address} has been processed and is ready.

You will receive an invoice shortly. Once paid, your download links will be automatically enabled on your dashboard.""",
        {"property_address": shoot_address}
    )
    _send_mocked_email(
        subject=subject,
        html_content=_get_email_template("Processing Complete", content_html),
        to_email=to_email,
        cc=m_cc,
        bcc=m_bcc,
        recipient_type='client',
    )

def send_invoice_generated_email(shoot_address, payment_link, to_email=None):
    subject, content_html, i_cc, i_bcc = get_template_content(
        "invoice-ready",
        f"Invoice for Your Recent Shoot - {shoot_address[:50]}",
        """The invoice for your recent shoot at {property_address} is now ready for payment.

Please click the button below to complete your payment securely via Stripe. Your media will be available for download immediately after payment.""",
        {"property_address": shoot_address}
    )
    _send_mocked_email(
        subject=subject,
        html_content=_get_email_template("Invoice Ready", content_html, "Pay Securely via Stripe", payment_link),
        to_email=to_email,
        cc=i_cc,
        bcc=i_bcc,
        recipient_type='client',
    )

def send_payment_confirmed_emails(shoot_address, dashboard_link):
    admin_content = f"Payment has been successfully received for {shoot_address}. Media access has been granted to the client."
    _send_mocked_email(
        subject=f"Payment Received - {shoot_address[:50]}",
        html_content=_get_email_template("Payment Captured", admin_content),
        to_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else "admin@example.com",
        recipient_type='admin',
    )

    # Customer notification
    subject, content_html, p_cc, p_bcc = get_template_content(
        "payment-confirmed",
        "Payment Receipt & Media Download Link",
        """Thank you for your payment!

Payment for {property_address} has been confirmed. You can now access and download all high-resolution media directly from your dashboard.""",
        {"property_address": shoot_address}
    )
    _send_mocked_email(
        subject=subject,
        html_content=_get_email_template("Payment Successful", content_html, "Go to Dashboard", dashboard_link),
        to_email=None,
        cc=p_cc,
        bcc=p_bcc,
        recipient_type='client',
    )

def send_referral_received_email(referral):
    context = {
        "referrer_name": referral.referrer.get_full_name() or referral.referrer.username,
        "referee_name": referral.referee_name,
        "site_url": "http://localhost:3000" # Fallback
    }
    
    # Try to get base URL from settings
    if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS:
        context["site_url"] = settings.CORS_ALLOWED_ORIGINS[0]

    subject, content_html, r_cc, r_bcc = get_template_content(
        "referral-received",
        "You've been referred to KC Real Estate Media!",
        """Hi {referee_name},

{referrer_name} has referred you to KC Real Estate Media for your property photography and media needs.

We provide premium real estate media services to help your listings stand out. Click the button below to explore our services and book your first shoot!""",
        context
    )
    
    html_content = _get_email_template(
        "You've Been Referred", 
        content_html, 
        "Create Account & Get Started", 
        f"{context['site_url']}/login?register=true&email={referral.referee_email}"
    )
    return _send_mocked_email(subject, html_content, to_email=referral.referee_email, cc=r_cc, bcc=r_bcc, recipient_type='client')

def send_referral_reward_earned_email(user, amount):
    context = {
        "name": user.get_full_name() or user.username,
        "amount": f"{amount:.2f}",
        "dashboard_url": "http://localhost:3000/dashboard"
    }
    
    if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS:
        context["dashboard_url"] = f"{settings.CORS_ALLOWED_ORIGINS[0]}/dashboard"

    subject, content_html, re_cc, re_bcc = get_template_content(
        "referral-reward-earned",
        "You've earned a referral reward!",
        """Hi {name},

Great news! One of your referrals has completed their first shoot. As a thank you, we've added a ${amount} credit to your account.

This credit will be automatically applied to your next invoice. Thank you for being a part of KC Real Estate Media!""",
        context
    )
    
    html_content = _get_email_template("Referral Reward Earned", content_html, "View Dashboard", context["dashboard_url"])
    return _send_mocked_email(subject, html_content, to_email=user.email, cc=re_cc, bcc=re_bcc, recipient_type='client')

def send_thank_you_payment_email(shoot_address, to_email, photographer_id):
    """
    Sends a thank you email after payment, including a link to rate the photographer.
    """
    site_url = "http://localhost:3000"
    if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS:
        site_url = settings.CORS_ALLOWED_ORIGINS[0]

    rating_link = f"{site_url}/rate-photographer?id={photographer_id}"
    
    context = {
        "property_address": shoot_address,
        "rating_link": rating_link
    }

    subject, content_html, t_cc, t_bcc = get_template_content(
        "payment-thank-you",
        "Thank You for Your Payment!",
        """Hi there,
        
Thank you for your payment for the shoot at {property_address}. We hope you're thrilled with the results!

We're always looking to improve our service. Would you mind taking a moment to rate your photographer? Your feedback helps us maintain the highest quality standards.""",
        context
    )

    html_content = _get_email_template(
        "Thank You & Rate Us", 
        content_html, 
        "Rate Your Photographer", 
        rating_link
    )
    
    return _send_mocked_email(subject, html_content, to_email=to_email, cc=t_cc, bcc=t_bcc, recipient_type='client')
