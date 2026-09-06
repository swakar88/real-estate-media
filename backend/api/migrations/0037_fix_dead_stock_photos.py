from django.db import migrations


# (key, old dead URL fragment id, new url)
SITE_MEDIA_FIXES = [
    ('home_service_1', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
    ('services_grass', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
    ('services_drone', 'https://images.unsplash.com/photo-1499310392581-322cec0355a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'),
]

SITE_MEDIA_OLD = {
    'home_service_1': 'https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'services_grass': 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'services_drone': 'https://images.unsplash.com/photo-1628611225249-6c4c9258dcc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
}

GALLERY_FIXES = [
    ('Luxury Exterior', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'),
    ('Home Office Setup', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'),
]

GALLERY_OLD = {
    'Luxury Exterior': 'https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    'Home Office Setup': 'https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
}


def fix_urls(apps, schema_editor):
    SiteMedia = apps.get_model('api', 'SiteMedia')
    GalleryImage = apps.get_model('api', 'GalleryImage')

    for key, new_url in SITE_MEDIA_FIXES:
        SiteMedia.objects.filter(key=key).update(url=new_url)

    for title, new_url in GALLERY_FIXES:
        # Case-insensitive: the live DB has "Home Office setup" (lowercase s),
        # which has drifted from seed_media.py's "Home Office Setup" over time.
        GalleryImage.objects.filter(title__iexact=title).update(image_url=new_url)


def revert_urls(apps, schema_editor):
    SiteMedia = apps.get_model('api', 'SiteMedia')
    GalleryImage = apps.get_model('api', 'GalleryImage')

    for key, old_url in SITE_MEDIA_OLD.items():
        SiteMedia.objects.filter(key=key).update(url=old_url)

    for title, old_url in GALLERY_OLD.items():
        GalleryImage.objects.filter(title__iexact=title).update(image_url=old_url)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_add_photos_only_package'),
    ]

    operations = [
        migrations.RunPython(fix_urls, revert_urls),
    ]
