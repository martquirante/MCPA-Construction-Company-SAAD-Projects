import cv2
import numpy as np
import os
from PIL import Image

user_img_path = r"C:\Users\martq\.gemini\antigravity-ide\brain\9bdc9131-4045-4639-91c4-459d95125855\.user_uploaded\media_1790588521522.jpg"
img = cv2.imread(user_img_path, cv2.IMREAD_GRAYSCALE)

# 4x Lanczos upscale for subpixel edge resolution
upscaled = cv2.resize(img, (4000, 4000), interpolation=cv2.INTER_LANCZOS4)

# Binary threshold
_, thresh = cv2.threshold(upscaled, 160, 255, cv2.THRESH_BINARY_INV)

# Find contours
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)

# Find bounding box in 4000px space
all_pts = np.vstack([cv2.approxPolyDP(c, 1.2, True) for c in contours])
min_x, min_y = all_pts.min(axis=0)[0]
max_x, max_y = all_pts.max(axis=0)[0]

print(f"4x Bounds: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
orig_w = max_x - min_x
orig_h = max_y - min_y

# Scale coordinates down to a standard 1000px coordinate system:
scale = 1000.0 / orig_w
norm_w = 1000.0
norm_h = orig_h * scale

pad_x = 10.0
pad_y = 10.0
vx = -pad_x
vy = -pad_y
vw = norm_w + pad_x * 2
vh = norm_h + pad_y * 2

svg_d_list = []
for c in contours:
    approx = cv2.approxPolyDP(c, 1.2, True)
    pts = approx.reshape(-1, 2)
    if len(pts) < 3:
        continue
    # Translate and scale points
    d_parts = []
    x0 = (pts[0][0] - min_x) * scale
    y0 = (pts[0][1] - min_y) * scale
    d_parts.append(f"M{x0:.1f},{y0:.1f}")
    for pt in pts[1:]:
        x = (pt[0] - min_x) * scale
        y = (pt[1] - min_y) * scale
        d_parts.append(f"L{x:.1f},{y:.1f}")
    d_parts.append("Z")
    svg_d_list.append(" ".join(d_parts))

full_d = " ".join(svg_d_list)

out_assets_dir = r"c:\Users\martq\Documents\SAAD_Project_Development\MCPA_devWorkSpace\frontend\public\assets"
out_public_dir = r"c:\Users\martq\Documents\SAAD_Project_Development\MCPA_devWorkSpace\frontend\public"

# 1. Dark/Black Logo (for light mode)
svg_dark = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.1f} {vy:.1f} {vw:.1f} {vh:.1f}" width="100%" height="100%">
  <path fill="#121212" fill-rule="evenodd" d="{full_d}" />
</svg>"""

with open(os.path.join(out_assets_dir, "mcpa-logo.svg"), "w") as f:
    f.write(svg_dark)

# 2. White Logo (for dark mode & hero background)
svg_white = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.1f} {vy:.1f} {vw:.1f} {vh:.1f}" width="100%" height="100%">
  <path fill="#ffffff" fill-rule="evenodd" d="{full_d}" />
</svg>"""

with open(os.path.join(out_assets_dir, "logo-white.svg"), "w") as f:
    f.write(svg_white)

# 3. Dynamic currentColor Logo
svg_dynamic = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.1f} {vy:.1f} {vw:.1f} {vh:.1f}" width="100%" height="100%">
  <path fill="currentColor" fill-rule="evenodd" d="{full_d}" />
</svg>"""

with open(os.path.join(out_assets_dir, "mcpa-dynamic.svg"), "w") as f:
    f.write(svg_dynamic)

print("Saved mcpa-logo.svg, logo-white.svg, and mcpa-dynamic.svg!")

# 4. Generate Square Vector Favicon / Tab Icon
# In 512x512 square, white rounded squircle with black MCPA mark
favicon_pad_x = 24
target_w = 512 - favicon_pad_x * 2
fav_scale = target_w / vw
fav_h = vh * fav_scale
fav_y_offset = (512 - fav_h) / 2

favicon_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="80" fill="#ffffff" />
  <g transform="translate({favicon_pad_x}, {fav_y_offset:.1f}) scale({fav_scale:.4f})">
    <path fill="#121212" fill-rule="evenodd" d="{full_d}" />
  </g>
</svg>"""

with open(os.path.join(out_public_dir, "icon.svg"), "w") as f:
    f.write(favicon_svg)

# Also create a light-mode tab icon version or universal icon
print("Saved icon.svg!")

# 5. Render 512x512 PNG icon.png using OpenCV & Pillow
canvas = np.zeros((512, 512, 4), dtype=np.uint8)
# Dark rounded square background:
# Draw dark rounded rectangle on canvas
# Or clean white rounded rectangle with dark mark:
# In media_1790588504301.png, user has dark browser tab, and the tab icon is a white rounded box with the MCPA logo!
# Let's make it a crisp white squircle with the razor-sharp black MCPA logo perfectly centered and scaled!
canvas[:, :] = [0, 0, 0, 0] # transparent

# Draw white rounded square with 80px corner radius
radius = 80
cv2.rectangle(canvas, (radius, 0), (512 - radius, 512), (255, 255, 255, 255), -1)
cv2.rectangle(canvas, (0, radius), (512, 512 - radius), (255, 255, 255, 255), -1)
cv2.circle(canvas, (radius, radius), radius, (255, 255, 255, 255), -1)
cv2.circle(canvas, (512 - radius, radius), radius, (255, 255, 255, 255), -1)
cv2.circle(canvas, (radius, 512 - radius), radius, (255, 255, 255, 255), -1)
cv2.circle(canvas, (512 - radius, 512 - radius), radius, (255, 255, 255, 255), -1)

# Now render the logo into the center of this white squircle:
# Use 4x upscaled thresholded image for rendering into 512x512
logo_crop = thresh[min_y:max_y, min_x:max_x]
# Resize logo_crop to target width inside the squircle (e.g. 450px wide)
target_logo_w = 464
target_logo_h = int(target_logo_w * (orig_h / orig_w))
logo_resized = cv2.resize(logo_crop, (target_logo_w, target_logo_h), interpolation=cv2.INTER_AREA)

# Center it in 512x512
start_x = (512 - target_logo_w) // 2
start_y = (512 - target_logo_h) // 2

# Apply black logo on white canvas
for y in range(target_logo_h):
    for x in range(target_logo_w):
        val = logo_resized[y, x]
        if val > 0:
            alpha = val / 255.0
            # Blend black into canvas
            canvas[start_y + y, start_x + x, 0] = int(18 * alpha + 255 * (1 - alpha))
            canvas[start_y + y, start_x + x, 1] = int(18 * alpha + 255 * (1 - alpha))
            canvas[start_y + y, start_x + x, 2] = int(18 * alpha + 255 * (1 - alpha))
            canvas[start_y + y, start_x + x, 3] = 255

# Save icon.png
pil_icon = Image.fromarray(canvas, mode="RGBA")
pil_icon.save(os.path.join(out_public_dir, "icon.png"), "PNG")
print("Saved 512x512 icon.png!")

# Also generate favicon.ico with 16x16, 32x32, 48x48
pil_icon.save(
    os.path.join(out_public_dir, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
)
print("Saved multi-size favicon.ico!")
