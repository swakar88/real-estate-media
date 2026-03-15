import os
import django
import sys
import boto3

# Add the parent directory to sys.path so 'backend' is recognized as a package
sys.path.append('c:/Dev/Krishna/real-estate-media')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings') 
django.setup()

from django.conf import settings

def list_r2_objects(prefix):
    s3 = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        config=boto3.session.Config(s3={'addressing_style': 'path'})
    )
    try:
        response = s3.list_objects_v2(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Prefix=prefix)
        print(f"Listing objects with prefix: {prefix}")
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"- {obj['Key']} ({obj['Size']} bytes)")
        else:
            print("No objects found.")
    except Exception as e:
        print(f"Error listing R2 objects: {e}")

if __name__ == "__main__":
    list_r2_objects("orders/shoot_7/")
