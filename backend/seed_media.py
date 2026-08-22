import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import SiteMedia, GalleryImage

media_items = [
    {
        "key": "home_hero_bg",
        "title": "Home Page Hero Background",
        "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "media_type": "image",
        "description": "The main background image on the landing page header."
    },
    {
        "key": "home_service_1",
        "title": "Home Page Service 1 (Real Estate)",
        "url": "https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "description": "First service block image on the home page."
    },
    {
        "key": "home_service_2",
        "title": "Home Page Service 2 (Business)",
        "url": "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "description": "Second service block image on the home page."
    },
    {
        "key": "home_service_3",
        "title": "Home Page Service 3 (Portrait & Aerial)",
        "url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "description": "Third service block image on the home page."
    },
    {
        "key": "about_agency_photo",
        "title": "About Us Agency Photo",
        "url": "/team/agency.png",
        "media_type": "image",
        "description": "The slanted floating image showing the agency/team on the About page."
    },
    {
        "key": "services_dusk",
        "title": "Services - Day to Dusk",
        "url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "description": "Image demonstrating twilight photography."
    },
    {
        "key": "services_staging",
        "title": "Services - Virtual Staging",
        "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "description": "Image demonstrating virtual staging or decluttering."
    },
    {
        "key": "services_grass",
        "title": "Services - Green Grass Edit",
        "url": "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "media_type": "image",
        "description": "Image demonstrating grass greening edits."
    },
    {
        "key": "services_drone",
        "title": "Services - Drone Aerial Video",
        "url": "https://images.unsplash.com/photo-1628611225249-6c4c9258dcc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "media_type": "image",
        "description": "The large image/video thumbnail for the drone section."
    }
]

for item in media_items:
    SiteMedia.objects.get_or_create(
        key=item['key'],
        defaults={
            'title': item['title'],
            'url': item['url'],
            'media_type': item['media_type'],
            'description': item['description']
        }
    )

# Gallery images — only created on first deploy; never overwritten
gallery_items = [
    {"title": "Modern Living Room",   "category": "interior",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Luxury Exterior",      "category": "exterior",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Minimalist Kitchen",   "category": "interior",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Twilight Pool",        "category": "twilight",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Cozy Bedroom",         "category": "interior",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Aerial Estate",        "category": "aerial",    "featured": True,  "image_url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Elegant Bathroom",     "category": "interior",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Home Office Setup",    "category": "interior",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600607687931-ceeb66d11362?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
    {"title": "Spacious Patio",       "category": "exterior",  "featured": True,  "image_url": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"},
]

for item in gallery_items:
    GalleryImage.objects.get_or_create(
        title=item['title'],
        category=item['category'],
        defaults={
            'image_url': item['image_url'],
            'featured': item['featured'],
        }
    )

print("Successfully seeded SiteMedia and GalleryImage tables!")
