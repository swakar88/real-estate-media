import datetime
from django.db import migrations
from django.utils import timezone

# Starter availability: 3 slots/weekday, next 3 business weeks, for each active
# photographer. This is example data to unblock the booking flow at launch —
# replace with real schedules via the photographer portal.
STARTER_TIME_SLOTS = ['09:00', '13:00', '17:00']
BUSINESS_DAYS_AHEAD = 15  # ~3 weeks of weekdays


def seed_slots(apps, schema_editor):
    Photographer = apps.get_model('api', 'Photographer')
    PhotographerSlot = apps.get_model('api', 'PhotographerSlot')

    photographers = list(Photographer.objects.filter(is_active=True))
    if not photographers:
        return

    today = timezone.now().date()
    added = 0
    day_offset = 1
    business_days_seen = 0
    while business_days_seen < BUSINESS_DAYS_AHEAD:
        date = today + datetime.timedelta(days=day_offset)
        day_offset += 1
        if date.weekday() >= 5:  # skip Sat/Sun
            continue
        business_days_seen += 1
        for photographer in photographers:
            for time_slot in STARTER_TIME_SLOTS:
                _, created = PhotographerSlot.objects.get_or_create(
                    photographer=photographer,
                    date=date,
                    time_slot=time_slot,
                    defaults={'is_booked': False},
                )
                if created:
                    added += 1


def unseed_slots(apps, schema_editor):
    # Best-effort revert: only remove still-unbooked slots matching the
    # starter time windows in the future, so we never touch real bookings
    # made against these slots after they were seeded.
    PhotographerSlot = apps.get_model('api', 'PhotographerSlot')
    today = timezone.now().date()
    PhotographerSlot.objects.filter(
        date__gt=today,
        time_slot__in=STARTER_TIME_SLOTS,
        is_booked=False,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0037_fix_dead_stock_photos'),
    ]

    operations = [
        migrations.RunPython(seed_slots, unseed_slots),
    ]
