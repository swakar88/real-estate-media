from django.db import migrations


# Test/junk packages that accumulated in production outside the seeded set
# (created ad hoc via the admin panel during QA testing), unrelated to the
# 4-package Tour/Premier/Liftoff/Viral lineup.
STRAY_NAMES = [
    'Tom',
    'Nex1',
    'MediaPAckage_1',
    'MediaPAckage2',
    'Media!2nd_Apr1,',
    'MediaText_Apr1',
]


def remove_strays(apps, schema_editor):
    Package = apps.get_model('api', 'Package')
    Package.objects.filter(name__in=STRAY_NAMES).delete()


def noop_reverse(apps, schema_editor):
    # Not restorable — these were junk test rows, not real data worth reviving.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_reprice_packages_seed_addons'),
    ]

    operations = [
        migrations.RunPython(remove_strays, noop_reverse),
    ]
