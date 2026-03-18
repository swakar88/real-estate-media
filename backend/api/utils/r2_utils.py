import boto3
from django.conf import settings

def get_boto3_client():
    """
    Returns a configured Boto3 client for Cloudflare R2
    """
    return boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        config=boto3.session.Config(s3={'addressing_style': 'path'})
    )

def generate_presigned_put(object_key, file_type, expires_in=3600):
    """
    Generate a presigned PUT url for direct binary uploading from the browser
    """
    s3_client = get_boto3_client()
    try:
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': object_key,
                'ContentType': file_type
            },
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        print(f"Error generating presigned put: {e}")
        return None

def generate_presigned_url(object_key, expires_in=86400, as_attachment=False, filename=None):
    """
    Generate a presigned GET url for downloading a file securely.
    If as_attachment is True, it sets Content-Disposition to force download.
    """
    s3_client = get_boto3_client()
    try:
        params = {
            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
            'Key': object_key
        }
        
        if as_attachment:
            disp = 'attachment'
            if filename:
                # Basic cleaning of filename to avoid header issues
                clean_name = filename.replace('"', '').replace("'", "")
                disp = f'attachment; filename="{clean_name}"'
            params['ResponseContentDisposition'] = disp

        response = s3_client.generate_presigned_url(
            'get_object',
            Params=params,
            ExpiresIn=expires_in
        )
        return response
    except Exception as e:
        print(f"Error generating presigned url: {e}")
        return None
def get_object_content(object_key):
    """
    Fetch the content of an object from R2.
    """
    s3_client = get_boto3_client()
    try:
        response = s3_client.get_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=object_key
        )
        return response['Body'].read()
    except Exception as e:
        print(f"Error fetching object content: {e}")
        return None

def upload_to_r2(file_obj, destination_path):
    """
    Upload a file object to R2 and return its public URL.
    """
    s3_client = get_boto3_client()
    try:
        # Determine content type
        content_type = getattr(file_obj, 'content_type', 'application/octet-stream')
        
        s3_client.upload_fileobj(
            file_obj,
            settings.AWS_STORAGE_BUCKET_NAME,
            destination_path,
            ExtraArgs={'ContentType': content_type}
        )
        
        # Use R2_PUBLIC_DOMAIN from settings
        public_domain = getattr(settings, 'R2_PUBLIC_DOMAIN', '').strip()
        if not public_domain:
            # Fallback if domain is not set
            return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.r2.cloudflarestorage.com/{destination_path}"
            
        return f"{public_domain}/{destination_path}"
    except Exception as e:
        print(f"Error uploading to R2: {e}")
        return None
