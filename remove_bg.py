from PIL import Image
import os
import glob

def make_transparent(img_path):
    print(f"Processing {img_path}")
    try:
        from rembg import remove
        with open(img_path, 'rb') as i:
            input_data = i.read()
            output_data = remove(input_data)
        with open(img_path, 'wb') as o:
            o.write(output_data)
        print(f"Success rembg: {img_path}")
    except ImportError:
        print("rembg not installed, trying PIL basic")
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        new_data = []
        # Get background color from top-left pixel
        bg_color = datas[0]
        # Threshold for color distance
        threshold = 30
        for item in datas:
            if abs(item[0] - bg_color[0]) < threshold and \
               abs(item[1] - bg_color[1]) < threshold and \
               abs(item[2] - bg_color[2]) < threshold:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        img.putdata(new_data)
        img.save(img_path, "PNG")
        print(f"Success PIL: {img_path}")

for f in glob.glob("icons/block_*.png"):
    make_transparent(f)

