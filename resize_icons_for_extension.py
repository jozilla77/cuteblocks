from PIL import Image
import os

source_image = r"C:\Users\USER\.gemini\antigravity\brain\5ad772cc-2ebc-4f3c-bdba-cccc5643cf65\media__1782728475024.jpg"
target_dir = r"c:\projects\bubble puzzle\icons"

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

sizes = [16, 48, 128, 192, 512]

try:
    with Image.open(source_image) as img:
        # Convert to RGBA to ensure alpha channel support when saving as PNG
        img = img.convert("RGBA")
        for size in sizes:
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            target_file = os.path.join(target_dir, f"icon-{size}.png")
            resized_img.save(target_file, "PNG")
            print(f"Saved {target_file}")
    print("All icons successfully generated!")
except Exception as e:
    print(f"Error processing image: {e}")
