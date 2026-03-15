import os
import django
import sys

# Add the project roots
sys.path.append('c:/Dev/Krishna/real-estate-media/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') 
django.setup()

from api.models import ClientShoot, MediaItem

def run_fix():
    s = ClientShoot.objects.filter(id=8).first()
    if s:
        s.payment_status = 'paid'
        s.status = 'delivered'
        s.save()
        print(f"SHOOT 8 UPDATED: {s.property_address} - Payment: {s.payment_status}")
        items = MediaItem.objects.filter(shoot=s)
        print(f"Found {items.count()} media items.")
        for i in items:
            print(f"- ITEM {i.id}: {i.gcs_object_key} (Type: {i.media_type})")
    else:
        print("SHOOT 8 NOT FOUND")

if __name__ == "__main__":
    run_fix()
