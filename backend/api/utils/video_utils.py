import os
import subprocess
import tempfile
import threading
from django.conf import settings
from .r2_utils import get_boto3_client

FFMPEG_PATH = r"C:\Users\Karthik Pandy\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-essentials_build\bin\ffmpeg.exe"

def process_video_item(media_item):
    """
    Utility to process a video: generates watermarked/compressed version and uploads it to R2.
    """
    if media_item.media_type != 'video' or not media_item.gcs_object_key:
        return
        
    bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
    if not bucket_name:
        return
        
    s3_client = get_boto3_client()
    
    # Create temp directory
    with tempfile.TemporaryDirectory() as tmp_dir:
        filename = os.path.basename(media_item.gcs_object_key)
        local_input = os.path.join(tmp_dir, f"input_{filename}")
        local_output = os.path.join(tmp_dir, f"output_{filename}")
        
        try:
            # 1. Download original
            print(f"Downloading video for processing: {media_item.gcs_object_key}")
            s3_client.download_file(bucket_name, media_item.gcs_object_key, local_input)
            
            # 2. Apply Watermark and Compress using FFmpeg
            # Text watermark in center
            watermark_text = "KC REAL ESTATE MEDIA"
            
            # FFmpeg Filter: 
            # - scale to 720p (1280:-1)
            # - drawtext: white, 60pt, 0.4 opacity, center
            # - libx264, preset fast, crf 28 (good compression)
            # - audio copy
            
            # Escape text for ffmpeg filter
            escaped_text = watermark_text.replace("'", "'\\''").replace(":", "\\:")
            
            command = [
                FFMPEG_PATH,
                "-i", local_input,
                "-vf", f"scale=1280:-1,drawtext=text='{escaped_text}':fontcolor=white:fontsize=48:alpha=0.3:x=(w-text_w)/2:y=(h-text_h)/2",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "28",
                "-c:a", "aac",
                "-b:a", "128k",
                "-y",
                local_output
            ]
            
            print(f"Running FFmpeg: {' '.join(command)}")
            result = subprocess.run(command, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"FFmpeg Error: {result.stderr}")
                return
            
            # 3. Upload Watermarked Version
            watermarked_key = f"orders/shoot_{media_item.shoot.id}/watermarked/{filename}"
            print(f"Uploading processed video to: {watermarked_key}")
            
            s3_client.upload_file(
                local_output,
                bucket_name,
                watermarked_key,
                ExtraArgs={'ContentType': 'video/mp4'}
            )
            
            # 4. Update MediaItem
            media_item.watermarked_url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{watermarked_key}"
            media_item.is_processed = True
            media_item.save()
            print(f"Video processing complete for {media_item.id}")
            
        except Exception as e:
            print(f"Error processing video: {str(e)}")

def trigger_video_processing(media_item):
    """
    Triggers video processing in a background thread.
    """
    threading.Thread(target=process_video_item, args=(media_item,)).start()
