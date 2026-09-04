import zlib
import struct
import os

def create_png(width, height, r, g, b, a=255):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc
    
    # Raw pixel data (RGBA) with filter byte 0 at the start of each line
    raw_data = bytearray()
    center_x, center_y = width / 2.0, height / 2.0
    radius = min(width, height) * 0.45
    
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            dx = x - center_x
            dy = y - center_y
            dist = (dx*dx + dy*dy) ** 0.5
            if dist <= radius:
                # Indigo color #6366f1
                raw_data.extend([99, 102, 241, 255])
            else:
                raw_data.extend([0, 0, 0, 0])
                
    compressed = zlib.compress(bytes(raw_data))
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
    
    # IEND
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    png += struct.pack('>I', 0) + b'IEND' + iend_crc
    return png

os.makedirs('src-tauri/icons', exist_ok=True)

# 32x32
with open('src-tauri/icons/32x32.png', 'wb') as f:
    f.write(create_png(32, 32, 99, 102, 241))

# 128x128
with open('src-tauri/icons/128x128.png', 'wb') as f:
    f.write(create_png(128, 128, 99, 102, 241))

# 128x128@2x (256x256)
with open('src-tauri/icons/128x128@2x.png', 'wb') as f:
    f.write(create_png(256, 256, 99, 102, 241))

# Copy as icon.ico and icon.icns placeholders
with open('src-tauri/icons/icon.ico', 'wb') as f:
    f.write(create_png(32, 32, 99, 102, 241))

with open('src-tauri/icons/icon.icns', 'wb') as f:
    f.write(create_png(128, 128, 99, 102, 241))

print("Icons successfully generated in src-tauri/icons")
