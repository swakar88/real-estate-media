import os
import django
import sys

# Add the project root to sys.path
sys.path.append('c:/Dev/Krishna/real-estate-media')
# Add the backend directory
sys.path.append('c:/Dev/Krishna/real-estate-media/backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') 
django.setup()

from api.models import ClientShoot, MediaItem

def run_fix():
    try:
        shoot = ClientShoot.objects.get(id=7)
        print(f"Prop: {shoot.property_address}")
        print(f"Current Status: {shoot.status}, Current Payment: {shoot.payment_status}")
        
        # Standardize to lowercase 'paid'
        shoot.payment_status = 'paid'
        shoot.status = 'delivered'
        shoot.save()
        
        print(f"Updated Status: {shoot.status}, Payment: {shoot.payment_status}")
        
        # Also check MediaItems
        items = MediaItem.objects.filter(shoot=shoot)
        print(f"Found {items.count()} media items for this shoot.")
        for item in items:
            print(f"- Item {item.id}: {item.gcs_object_key} (Type: {item.media_type})")
            
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    run_fix()
