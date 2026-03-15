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
