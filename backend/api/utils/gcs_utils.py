import os
import datetime
from google.cloud import storage
from google.oauth2 import service_account
from django.conf import settings
import json

def get_gcs_client():
    """
    Initializes and returns a GCS client using credentials from settings.
    """
    creds_json = getattr(settings, 'GCS_CREDENTIALS_JSON', None)
    project_id = getattr(settings, 'GCS_PROJECT_ID', None)
    
    if not creds_json:
        return storage.Client(project=project_id)
    
    try:
        # Check if it's a file path or a JSON string
        if os.path.exists(creds_json):
            return storage.Client.from_service_account_json(creds_json, project=project_id)
        else:
            info = json.loads(creds_json)
            credentials = service_account.Credentials.from_service_account_info(info)
            return storage.Client(credentials=credentials, project=project_id)
    except Exception as e:
        print(f"Error initializing GCS client: {e}")
        return storage.Client(project=project_id) # Fallback to default auth

def generate_gcs_presigned_url(object_key, expiration_seconds=3600, method='GET'):
    """
    Generates a presigned URL for a GCS object.
    """
    bucket_name = getattr(settings, 'GCS_BUCKET_NAME', None)
    if not bucket_name:
        return None
        
    try:
        client = get_gcs_client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_key)
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(seconds=expiration_seconds),
            method=method,
        )
        return url
    except Exception as e:
        print(f"Error generating GCS presigned URL: {e}")
        return None

def generate_gcs_upload_url(object_key, content_type='application/octet-stream', expiration_seconds=3600):
    """
    Generates a presigned URL for uploading to GCS.
    """
    return generate_gcs_presigned_url(object_key, expiration_seconds, method='PUT')
