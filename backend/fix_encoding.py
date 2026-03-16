import json
import io
import sys

# Try to read the file detecting UTF-16 or UTF-8
try:
    with open('seed_data.json', 'rb') as f:
        raw = f.read()
    
    # If it starts with UTF-16 LE BOM (FF FE)
    if raw.startswith(b'\xff\xfe'):
        # Read as utf-16
        text = raw.decode('utf-16')
    else:
        # Just read as utf-8 or cp1252
        try:
            text = raw.decode('utf-8-sig') # strips utf-8 bom if present
        except UnicodeDecodeError:
            text = raw.decode('utf-16') # fallback

    # Parse to ensure it's valid JSON
    data = json.loads(text)
    
    # Write back forcefully as UTF-8
    with open('seed_data.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=2)
        
    print("Successfully converted seed_data.json to UTF-8 without BOM.")
except Exception as e:
    print(f"Error converting: {e}")
