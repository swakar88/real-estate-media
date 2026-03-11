import os
import resend
from django.conf import settings

def send_photographer_invite_email(email, name, invite_link):
    """
    Send an email invitation to a new photographer using the Resend API.
    """
    resend.api_key = os.environ.get('RESEND_API_KEY')
    
    if not resend.api_key:
        print("Warning: RESEND_API_KEY is not set. Email not sent.")
        return False

    # In production, replace the 'from' email with a verified domain email
    # such as 'hello@kcrealestatemedia.com'
    from_email = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Welcome to KC Real Estate Media!</h2>
        <p style="color: #555; font-size: 16px;">Hi {name},</p>
        <p style="color: #555; font-size: 16px;">You have been invited to join the <strong>KC Real Estate Media</strong> team as a photographer.</p>
        <p style="color: #555; font-size: 16px;">Please click the button below to accept your invitation, set your password, and access your portal:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{invite_link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Accept Invitation & Set Password</a>
        </div>
        <p style="color: #555; font-size: 16px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #0066cc; font-size: 14px; word-break: break-all;"><a href="{invite_link}">{invite_link}</a></p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #888; font-size: 12px; text-align: center;">If you didn't expect this invitation, you can simply ignore this email.</p>
    </div>
    """

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
