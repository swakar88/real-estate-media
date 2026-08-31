from django.db import migrations


PACKAGE = {
    'pk': 5,
    'name': 'Photos Only',
    'price': '180.00',
    'is_popular': False,
    'order': 0,
    'description': 'Just the photos, no frills — perfect for a quick, budget-friendly listing.',
    'features': [
        'Unlimited Photos',
    ],
}


def add_package(apps, schema_editor):
    Package = apps.get_model('api', 'Package')
    Package.objects.update_or_create(
        pk=PACKAGE['pk'],
        defaults={
            'name': PACKAGE['name'],
            'price': PACKAGE['price'],
            'is_popular': PACKAGE['is_popular'],
            'order': PACKAGE['order'],
            'description': PACKAGE['description'],
            'features': PACKAGE['features'],
        },
    )


def remove_package(apps, schema_editor):
    Package = apps.get_model('api', 'Package')
    Package.objects.filter(pk=PACKAGE['pk']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_remove_stray_test_packages'),
    ]

    operations = [
        migrations.RunPython(add_package, remove_package),
    ]
