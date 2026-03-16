import io
import os
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
from .r2_utils import get_boto3_client

def apply_watermark(image_io, text="KC REAL ESTATE MEDIA"):
    """
    Applies a diagonal text watermark and resizes to a lower resolution for preview.
    """
    img = Image.open(image_io).convert("RGBA")
    
    # 1. Resize to "standard" low-res (e.g. max 1280px width)
    orig_w, orig_h = img.size
    new_w = 1200
    new_h = int((new_w / orig_w) * orig_h)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 2. Create watermark layer
    txt = Image.new('RGBA', img.size, (255, 255, 255, 0))
    
    # Try to load a font, fallback to default
    try:
        # On Windows, Arial is usually available
        font = ImageFont.truetype("arial.ttf", 60)
    except:
        font = ImageFont.load_default()
        
    d = ImageDraw.Draw(txt)
    
    # Draw text repeatedly or just in center
    # Let's do a central large diagonal watermark
    text_width = 800 # Approximate
    text_height = 100
    
    # Calculate position
    x = (img.size[0] - text_width) / 2
    y = (img.size[1] - text_height) / 2
    
    # Add some opacity to the text
    d.text((x, y), text, fill=(255, 255, 255, 60), font=font)
    
    # Combine
    out = Image.alpha_composite(img, txt)
    
    # Convert back to RGB for JPEG
    final = out.convert("RGB")
    
    # Save to buffer
    output_io = io.BytesIO()
    final.save(output_io, format="JPEG", quality=75)
    output_io.seek(0)
    
    return output_io

def process_photo_item(media_item):
    """
    Utility to process a photo: generates watermarked version and uploads it to R2.
    """
    if media_item.media_type != 'photo' or not media_item.gcs_object_key:
        return
        
    bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
    if not bucket_name:
        return
        
    s3_client = get_boto3_client()
    
    # 1. Download original
    input_io = io.BytesIO()
    s3_client.download_fileobj(bucket_name, media_item.gcs_object_key, input_io)
    input_io.seek(0)
    
    # 2. Apply Watermark
    watermarked_io = apply_watermark(input_io)
    
    # 3. Upload Watermarked Version
    # Key: orders/shoot_{id}/watermarked/{filename}
    filename = os.path.basename(media_item.gcs_object_key)
    watermarked_key = f"orders/shoot_{media_item.shoot.id}/watermarked/{filename}"
    
    s3_client.upload_fileobj(
        watermarked_io, 
        bucket_name, 
        watermarked_key,
        ExtraArgs={'ContentType': 'image/jpeg'}
    )
    
    # 4. Update MediaItem
    media_item.watermarked_url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{watermarked_key}"
    media_item.is_processed = True
    media_item.save()
    
    return watermarked_key
