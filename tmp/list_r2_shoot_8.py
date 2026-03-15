import boto3
import os

def list_r2():
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
    prefix = "orders/shoot_8/"
    
    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        with open("c:/Dev/Krishna/real-estate-media/tmp/r2_list_shoot_8.txt", 'w') as f:
            f.write(f"Bucket: {bucket}, Prefix: {prefix}\n")
            if 'Contents' in response:
                for obj in response['Contents']:
                    f.write(f"- {obj['Key']} ({obj['Size']} bytes)\n")
            else:
                f.write("No objects found.\n")
        print("Done writing to file.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_r2()
