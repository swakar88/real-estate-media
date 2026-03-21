"""
iCal (.ics) generation utilities.
Builds RFC 5545-compliant calendar objects without third-party dependencies.

Central Time offset: UTC-6 (standard) / UTC-5 (daylight saving).
We store all datetimes as UTC in the iCal file, converting from CT.
"""
import uuid
from datetime import datetime, timedelta, timezone
from email.mime.base import MIMEBase
from email import encoders


# Central Time is UTC-6 in standard time, UTC-5 in DST.
# For simplicity we always use UTC-6 (CST). A production system should
# use pytz or zoneinfo to handle DST accurately.
CT_OFFSET = timedelta(hours=6)  # offset to add to CT to get UTC


def _ct_to_utc(date_obj, time_str: str) -> datetime:
    """
    Convert a date + "HH:MM" time string in Central Time to a UTC datetime.
    date_obj: datetime.date
    time_str: "09:00", "11:00", etc.
    """
    hour, minute = map(int, time_str.split(':'))
    local_dt = datetime(date_obj.year, date_obj.month, date_obj.day, hour, minute, tzinfo=None)
    return local_dt + CT_OFFSET


def _fmt_dt(dt: datetime) -> str:
    """Format a UTC datetime as iCal DTSTART/DTEND value."""
    return dt.strftime('%Y%m%dT%H%M%SZ')


def _escape(text: str) -> str:
    """Escape special characters per RFC 5545."""
    return text.replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\n', '\\n')


def generate_ical(
    uid: str,
    summary: str,
    location: str,
    description: str,
    shoot_date,       # datetime.date
    time_slot: str,   # "09:00"
    duration_hours: int = 2,
    method: str = 'REQUEST',  # 'REQUEST', 'CANCEL'
    sequence: int = 0,
    organizer_email: str = 'noreply@kcrealestate.com',
    organizer_name: str = 'KC Real Estate Media',
    attendee_email: str = None,
) -> bytes:
    """
    Returns an RFC 5545 iCal file as bytes.

    method:
      - 'REQUEST' — create or update the event
      - 'CANCEL'  — cancel the event (attendee will see cancellation)
    """
    dt_start = _ct_to_utc(shoot_date, time_slot)
    dt_end = dt_start + timedelta(hours=duration_hours)
    now_str = _fmt_dt(datetime.now(timezone.utc))

    status = 'CANCELLED' if method == 'CANCEL' else 'CONFIRMED'

    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//KC Real Estate Media//Booking//EN',
        f'METHOD:{method}',
        'BEGIN:VEVENT',
        f'UID:{uid}',
        f'DTSTAMP:{now_str}',
        f'DTSTART:{_fmt_dt(dt_start)}',
        f'DTEND:{_fmt_dt(dt_end)}',
        f'SUMMARY:{_escape(summary)}',
        f'LOCATION:{_escape(location)}',
        f'DESCRIPTION:{_escape(description)}',
        f'STATUS:{status}',
        f'SEQUENCE:{sequence}',
        f'ORGANIZER;CN={_escape(organizer_name)}:mailto:{organizer_email}',
    ]

    if attendee_email:
        role = 'CHAIR' if method == 'CANCEL' else 'REQ-PARTICIPANT'
        lines.append(f'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE={role};PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{attendee_email}')

    lines += [
        'END:VEVENT',
        'END:VCALENDAR',
    ]

    return '\r\n'.join(lines).encode('utf-8')


def make_ical_attachment(ical_bytes: bytes) -> MIMEBase:
    """Wrap iCal bytes in a MIME attachment suitable for attaching to EmailMessage."""
    part = MIMEBase('text', 'calendar', method='REQUEST', name='invite.ics')
    part.set_payload(ical_bytes)
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', 'attachment', filename='invite.ics')
    return part
