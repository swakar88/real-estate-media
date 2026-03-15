import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import MediaItem, ClientShoot
from django.conf import settings

def fix_shoot_8_media_urls():
    shoot_id = 8
    items = MediaItem.objects.filter(shoot_id=shoot_id)
    base_url = "https://08a7edb7f6eb264d84969fdd077c8aa5.r2.cloudflarestorage.com/real-estate-media/"
    
    print(f"Fixing {items.count()} items for Shoot {shoot_id}...")
    
    for item in items:
        # Correct URL to point to clean asset (based on gcs_object_key)
        item.url = f"{base_url}{item.gcs_object_key}"
        
        # Correct watermarked_url to point to watermarked path
        # If it's a photo, clean is in photo/, WM is in watermarked/
        # If it's a video, clean is in video/, WM is in watermarked/
        filename = os.path.basename(item.gcs_object_key)
        item.watermarked_url = f"{base_url}orders/shoot_{shoot_id}/watermarked/{filename}"
        
        item.save()
        print(f"  Fixed Item {item.id}: {filename}")

if __name__ == "__main__":
    fix_shoot_8_media_urls()
