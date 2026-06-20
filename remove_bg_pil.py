from PIL import Image
import glob
import math

def color_distance(c1, c2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])))

def make_transparent(img_path):
    print(f"Processing {img_path}")
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # Assuming top-left corner is the background color
    bg_color = pixels[0, 0]
    
    # We will do a basic flood fill from edges, or just simple thresholding.
    # Simple thresholding might leave artifacts around the edges (anti-aliasing).
    # Since these are AI-generated blocks with solid backgrounds,
    # let's find the background color and replace it, applying some alpha blending 
    # to pixels near the threshold.
    
    for y in range(height):
        for x in range(width):
            c = pixels[x, y]
            dist = color_distance(c, bg_color)
            if dist < 25:
                pixels[x, y] = (c[0], c[1], c[2], 0)
            elif dist < 60:
                # Soft blend
                alpha = int(((dist - 25) / 35) * 255)
                pixels[x, y] = (c[0], c[1], c[2], alpha)
                
    img.save(img_path, "PNG")
    print(f"Success: {img_path}")

for f in glob.glob("icons/block_*.png"):
    make_transparent(f)

