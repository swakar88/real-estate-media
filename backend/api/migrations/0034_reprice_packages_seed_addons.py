from django.db import migrations


NEW_PACKAGES = [
    {
        'pk': 1,
        'name': 'Tour',
        'price': '220.00',
        'is_popular': False,
        'order': 1,
        'description': 'Great for standard listings that need clean, reliable photos fast.',
        'features': [
            'Up to 25 HDR Photos',
            'Same-Day Photo Delivery',
            'Blue Sky Guarantee',
        ],
    },
    {
        'pk': 2,
        'name': 'Premier',
        'price': '280.00',
        'is_popular': False,
        'order': 2,
        'description': 'Our most complete photo package for listings that need to stand out.',
        'features': [
            'Up to 40 HDR Photos',
            'Same-Day Photo Delivery',
            'Blue Sky Guarantee',
            'Floor Plan with Dimensions',
        ],
    },
    {
        'pk': 3,
        'name': 'Liftoff',
        'price': '340.00',
        'is_popular': True,
        'order': 3,
        'description': 'Photos plus aerial and 3D coverage for listings that need to sell the lifestyle.',
        'features': [
            'Up to 40 HDR Photos',
            '3D Virtual Tour',
            'Drone Photography (5 Aerials)',
            'Floor Plan with Dimensions',
        ],
    },
    {
        'pk': 4,
        'name': 'Viral',
        'price': '480.00',
        'is_popular': False,
        'order': 4,
        'description': 'Full video production built for social — the complete marketing package.',
        'features': [
            '4K Interior & Exterior Video',
            'Drone Flythroughs',
            'Social Media Reel Cut',
            'Licensed Music Track',
        ],
    },
]

OLD_PACKAGES = [
    {'pk': 1, 'name': 'Essential', 'price': '250.00', 'is_popular': False, 'order': 1,
     'description': 'Starter package', 'features': ['Up to 25 HDR Photos', 'Same-day Photo Delivery', 'Blue Sky Guarantee']},
    {'pk': 2, 'name': 'Premier Listing', 'price': '425.00', 'is_popular': True, 'order': 2,
     'description': 'The most popular choice', 'features': ['Up to 40 HDR Photos', '3D Virtual Tour', 'Drone Photography (5 aerials)', 'Floor Plan with Dimensions']},
    {'pk': 3, 'name': 'Cinematic Video', 'price': '600.00', 'is_popular': False, 'order': 3,
     'description': 'High-end video package', 'features': ['4K Interior & Exterior Video', 'Drone Flythroughs', 'Social Media Reel Cut', 'Licensed Music Track']},
]

ADDONS = [
    {'name': 'Twilight Conversion', 'price': '10.00', 'turnaround': '24 Hours', 'order': 1,
     'description': 'Convert a daytime exterior photo into a stunning twilight shot.'},
    {'name': 'Virtual De-clutter', 'price': '10.00', 'turnaround': '24 Hours', 'order': 2,
     'description': 'Digitally remove clutter or unwanted objects from a photo.'},
    {'name': 'Lush Grass Edit', 'price': '10.00', 'turnaround': '24 Hours', 'order': 3,
     'description': 'Enhance dull or patchy grass to a vibrant green.'},
]


def reprice_packages(apps, schema_editor):
    Package = apps.get_model('api', 'Package')
    for pkg in NEW_PACKAGES:
        Package.objects.update_or_create(
            pk=pkg['pk'],
            defaults={
                'name': pkg['name'],
                'price': pkg['price'],
                'is_popular': pkg['is_popular'],
                'order': pkg['order'],
                'description': pkg['description'],
                'features': pkg['features'],
            },
        )


def revert_packages(apps, schema_editor):
    Package = apps.get_model('api', 'Package')
    Package.objects.filter(pk=4).delete()
    for pkg in OLD_PACKAGES:
        Package.objects.update_or_create(
            pk=pkg['pk'],
            defaults={
                'name': pkg['name'],
                'price': pkg['price'],
                'is_popular': pkg['is_popular'],
                'order': pkg['order'],
                'description': pkg['description'],
                'features': pkg['features'],
            },
        )


def seed_addons(apps, schema_editor):
    AddOn = apps.get_model('api', 'AddOn')
    for addon in ADDONS:
        AddOn.objects.update_or_create(
            name=addon['name'],
            defaults={
                'price': addon['price'],
                'turnaround': addon['turnaround'],
                'order': addon['order'],
                'description': addon['description'],
            },
        )


def unseed_addons(apps, schema_editor):
    AddOn = apps.get_model('api', 'AddOn')
    AddOn.objects.filter(name__in=[a['name'] for a in ADDONS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0033_addon'),
    ]

    operations = [
        migrations.RunPython(reprice_packages, revert_packages),
        migrations.RunPython(seed_addons, unseed_addons),
    ]
