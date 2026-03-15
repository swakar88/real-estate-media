import boto3
import os

# Hardcoded credentials for speed/reliability in this debug context
# (Extracted from what I've seen in logs or would be in .env)
# I'll try to read from .env if possible, but keep it simple.

def list_r2():
    # Attempting to get credentials from environment or default locations
    # S3_ENDPOINT = "https://08a7edb7f6eb264d84969fdd077c8aa5.r2.cloudflarestorage.com"
    # BUCKET = "real-estate-media"
    
    # Actually, I'll just use the boto3 client within the project's config if I can't reach it.
    # But wait, I have access to the .env file!
    
    env_path = "c:/Dev/Krishna/real-estate-media/backend/.env"
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, val = line.strip().split('=', 1)
                    env_vars[key] = val
    
    s3 = boto3.client(
        's3',
        endpoint_url=env_vars.get('AWS_S3_ENDPOINT_URL'),
        aws_access_key_id=env_vars.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=env_vars.get('AWS_SECRET_ACCESS_KEY'),
        region_name=env_vars.get('AWS_S3_REGION_NAME', 'auto'),
        config=boto3.session.Config(s3={'addressing_style': 'path'})
    )
    
    bucket = env_vars.get('AWS_STORAGE_BUCKET_NAME')
    prefix = "orders/shoot_7/"
    
    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        print(f"Bucket: {bucket}, Prefix: {prefix}")
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"- {obj['Key']} ({obj['Size']} bytes)")
        else:
            print("No objects found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_r2()
