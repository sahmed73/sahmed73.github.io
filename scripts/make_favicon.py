"""Draw favicon.ico and apple-touch-icon.png to match favicon.svg.

    python3 scripts/make_favicon.py      # needs Pillow and the Georgia Bold font (macOS)

HTML pages use favicon.svg. Browsers fall back to /favicon.ico for files with no
HTML head (robots.txt, llms.txt, sitemap.xml, PDFs), and iPhones use
apple-touch-icon.png for home-screen bookmarks.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
BLUE, WHITE = "#1d4f91", "#ffffff"
SCALE = 16  # draw large, then shrink for smooth edges


def icon(size, rounded=True):
    """The favicon.svg design (48-unit grid) at the given pixel size."""
    big = 48 * SCALE
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=6 * SCALE if rounded else 0, fill=BLUE)
    font = ImageFont.truetype(FONT, 24 * SCALE)
    # SVG: x=24 (centered), baseline y=33.
    draw.text((24 * SCALE, 33 * SCALE), "SA", font=font, fill=WHITE, anchor="ms")
    return img.resize((size, size), Image.LANCZOS)


icon(256).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
# iOS rounds the corners itself and shows transparency as black, so draw it square.
icon(180, rounded=False).convert("RGB").save(ROOT / "apple-touch-icon.png", optimize=True)
print("wrote favicon.ico and apple-touch-icon.png")
