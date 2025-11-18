"""
Script to create a simple Datagaps favicon from SVG or create a simple colored icon
"""
import os

# Create a simple ICO file with Datagaps green color
# This is a minimal 16x16 ICO file in the Datagaps brand color
def create_simple_favicon():
    # ICO file header
    ico_header = bytes([
        0x00, 0x00,  # Reserved
        0x01, 0x00,  # Type (1 = ICO)
        0x01, 0x00,  # Number of images
    ])
    
    # Directory entry for 16x16 image
    dir_entry = bytes([
        0x10,        # Width (16)
        0x10,        # Height (16)
        0x00,        # Color palette (0 = no palette)
        0x00,        # Reserved
        0x01, 0x00,  # Color planes
        0x20, 0x00,  # Bits per pixel (32)
        0x00, 0x04, 0x00, 0x00,  # Size of image data (1024 bytes)
        0x16, 0x00, 0x00, 0x00,  # Offset to image data (22 bytes)
    ])
    
    # Create 16x16 RGBA bitmap data (Datagaps green #00864E)
    # Each pixel is 4 bytes: BGRA
    green_pixel = bytes([0x4E, 0x86, 0x00, 0xFF])  # BGRA format for #00864E
    white_pixel = bytes([0xFF, 0xFF, 0xFF, 0xFF])  # White
    transparent = bytes([0x00, 0x00, 0x00, 0x00])  # Transparent
    
    # BMP header (40 bytes)
    bmp_header = bytes([
        0x28, 0x00, 0x00, 0x00,  # Header size
        0x10, 0x00, 0x00, 0x00,  # Width (16)
        0x20, 0x00, 0x00, 0x00,  # Height (32 = 16*2 for ICO format)
        0x01, 0x00,              # Planes
        0x20, 0x00,              # Bits per pixel (32)
        0x00, 0x00, 0x00, 0x00,  # Compression (none)
        0x00, 0x00, 0x00, 0x00,  # Image size (can be 0 for uncompressed)
        0x00, 0x00, 0x00, 0x00,  # X pixels per meter
        0x00, 0x00, 0x00, 0x00,  # Y pixels per meter
        0x00, 0x00, 0x00, 0x00,  # Colors used
        0x00, 0x00, 0x00, 0x00,  # Important colors
    ])
    
    # Create a simple "D" shape for Datagaps
    # 16x16 pixel grid, bottom-up (BMP format)
    image_data = bytearray()
    
    # Create pattern for letter "D" in a circle
    pattern = [
        "0000000000000000",  # Row 15 (top)
        "0000000000000000",
        "0000111111000000",
        "0001111111100000",
        "0011111111110000",
        "0011110001110000",
        "0111100000111000",
        "0111000000011000",
        "0111000000011000",
        "0111100000111000",
        "0011110001110000",
        "0011111111110000",
        "0001111111100000",
        "0000111111000000",
        "0000000000000000",
        "0000000000000000",  # Row 0 (bottom)
    ]
    
    # BMP is stored bottom-up, so reverse the pattern
    for row in pattern:
        for char in row:
            if char == '1':
                image_data.extend(green_pixel)
            else:
                image_data.extend(transparent)
    
    # AND mask (all zeros = all visible, 16x16 bits = 32 bytes)
    and_mask = bytes([0x00] * 32)
    
    # Combine all parts
    ico_data = ico_header + dir_entry + bmp_header + image_data + and_mask
    
    return ico_data

# Write the favicon
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
favicon_path = os.path.join(project_root, 'frontend', 'public', 'favicon.ico')

print(f"Creating favicon at: {favicon_path}")
favicon_data = create_simple_favicon()
with open(favicon_path, 'wb') as f:
    f.write(favicon_data)
print(f"Favicon created successfully! ({len(favicon_data)} bytes)")

# Also copy to static folder
static_favicon_path = os.path.join(project_root, 'static', 'favicon.ico')
with open(static_favicon_path, 'wb') as f:
    f.write(favicon_data)
print(f"Favicon copied to static folder: {static_favicon_path}")
