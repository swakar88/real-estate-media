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
    )

def generate_presigned_post(object_key, file_type, expires_in=3600):
    """
    Generate a presigned post url for direct uploading from the browser
    """
    s3_client = get_boto3_client()
    try:
        response = s3_client.generate_presigned_post(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=object_key,
            Fields={"Content-Type": file_type},
            Conditions=[
                {"Content-Type": file_type},
                ["content-length-range", 0, 5000000000] # Max 5GB
            ],
            ExpiresIn=expires_in
        )
        return response
    except Exception as e:
        print(f"Error generating presigned post: {e}")
        return None

def generate_presigned_url(object_key, expires_in=86400):
    """
    Generate a presigned GET url for downloading a file securely
    """
    s3_client = get_boto3_client()
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': object_key
            },
            ExpiresIn=expires_in
        )
        return response
    except Exception as e:
        print(f"Error generating presigned url: {e}")
        return None
