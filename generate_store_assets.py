import os
from PIL import Image

def resize_image(input_path, output_path, size, crop=False):
    try:
        img = Image.open(input_path)
        if crop:
            # Crop to aspect ratio then resize
            target_ratio = size[0] / size[1]
            img_ratio = img.width / img.height
            if img_ratio > target_ratio:
                # Image is wider, crop width
                new_width = int(img.height * target_ratio)
                left = (img.width - new_width) / 2
                img = img.crop((left, 0, left + new_width, img.height))
            elif img_ratio < target_ratio:
                # Image is taller, crop height
                new_height = int(img.width / target_ratio)
                top = (img.height - new_height) / 2
                img = img.crop((0, top, img.width, top + new_height))
            
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path)
        print(f"Created {output_path} ({size[0]}x{size[1]})")
    except Exception as e:
        print(f"Error creating {output_path}: {e}")

# Paths
icons_dir = "icons"
base_icon = os.path.join(icons_dir, "icon-512.png")
base_bg = os.path.join(icons_dir, "game_bg.png")
store_assets_dir = "store_assets"

# Create output dir
os.makedirs(store_assets_dir, exist_ok=True)

# 1. Generate Icons
for size in [16, 48, 128]:
    resize_image(base_icon, os.path.join(icons_dir, f"icon-{size}.png"), (size, size))

# 2. Generate Store Screenshots / Promos
# Chrome Web Store screenshot (1280x800 or 640x400)
resize_image(base_bg, os.path.join(store_assets_dir, "screenshot_1.png"), (1280, 800), crop=True)

# Small promo tile (440x280)
resize_image(base_bg, os.path.join(store_assets_dir, "promo_tile_small.png"), (440, 280), crop=True)

# Marquee promo tile (1400x560)
resize_image(base_bg, os.path.join(store_assets_dir, "promo_tile_marquee.png"), (1400, 560), crop=True)

print("All assets generated!")
