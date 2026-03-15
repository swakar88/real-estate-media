import sys
import os

# Setup Django
sys.path.append('c:/Dev/Krishna/real-estate-media/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from api.models import MediaItem
import boto3
from django.conf import settings

def cleanup_ghosts(shoot_id):
    s3 = boto3.client(
        's3', 
        endpoint_url=settings.AWS_S3_ENDPOINT_URL, 
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID, 
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY, 
        region_name=settings.AWS_S3_REGION_NAME
    )
    
    items = MediaItem.objects.filter(shoot_id=shoot_id)
    deleted_count = 0
    remaining_count = 0
    
    print(f"Checking {items.count()} items for shoot {shoot_id}...")
    
    for item in items:
        try:
            s3.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=item.gcs_object_key)
            remaining_count += 1
        except Exception as e:
            print(f"Ghost found: {item.gcs_object_key} (ID: {item.id}) - Error: {e}")
            item.delete()
            deleted_count += 1
            
    print(f"Cleanup finished. Deleted {deleted_count} ghost records. {remaining_count} records remain.")

if __name__ == "__main__":
    cleanup_ghosts(7)
