"""Builds every Remainder icon from one logo image (assets/images/logo-source.webp, made in Gemini).

Run from the app folder:  python scripts/make-icons.py
To change the logo: replace logo-source.webp (square, mark on a flat orange background) and run again.
Writes assets/images/* (used by app.json) and the Android launcher + splash images in android/app/src/main/res.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

APP = Path(__file__).resolve().parent.parent
ASSETS = APP / 'assets' / 'images'
RES = APP / 'android' / 'app' / 'src' / 'main' / 'res'

src = Image.open(ASSETS / 'logo-source.webp').convert('RGB')
N = src.width

# 1. Background colour = median of the border pixels.
border = [src.getpixel((x, y)) for x in range(0, N, 25) for y in (5, N - 6)] + [src.getpixel((x, y)) for y in range(0, N, 25) for x in (5, N - 6)]
BG = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))

# 2. Mark mask: everything that is not background. Soft edge for smooth outlines.
diff = ImageChops.difference(src, Image.new('RGB', src.size, BG)).convert('L')
mask = diff.point(lambda v: 0 if v < 30 else 255 if v > 70 else int((v - 30) * 255 / 40))
# Drop the Gemini watermark (bottom-right corner) and any specks outside the mark.
mask.paste(0, (int(N * 0.86), int(N * 0.86), N, N))
mask = mask.filter(ImageFilter.MedianFilter(5))

mark = src.convert('RGBA')
mark.putalpha(mask)
mark = mark.crop(mask.getbbox())

# Ink only (dark pixels), for the one-colour Android themed icon.
ink_mask = ImageChops.multiply(mask, src.convert('L').point(lambda v: 255 if v < 90 else 0 if v > 150 else int((150 - v) * 255 / 60)))
ink = Image.new('RGBA', src.size, (255, 255, 255, 255))
ink.putalpha(ink_mask)
ink = ink.crop(mask.getbbox())


def place(img, size, fill, bg=(0, 0, 0, 0)):
    """img scaled so its longer side is `fill` of the canvas, centred."""
    canvas = Image.new('RGBA', (size, size), bg)
    scale = size * fill / max(img.size)
    piece = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)
    canvas.alpha_composite(piece, ((size - piece.width) // 2, (size - piece.height) // 2))
    return canvas


def circle(img):
    m = Image.new('L', (img.width * 4, img.height * 4), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).ellipse((0, 0, m.width - 1, m.height - 1), fill=255)
    out = img.copy()
    out.putalpha(ImageChops.multiply(img.getchannel('A'), m.resize(img.size, Image.LANCZOS)))
    return out


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == '.webp':
        img.save(path, 'WEBP', lossless=True)
    else:
        img.save(path, 'PNG')


ORANGE = (245, 239, 230, 255)  # icon background: the app's paper colour (the logo's own orange is only used to cut the mark out)
FULL, ADAPTIVE = 0.78, 0.56  # how much of the canvas the mark fills
# Adaptive icons are 108dp and launchers show the middle 66dp circle; 0.50 keeps the tilted card inside it.

save(place(mark, 1024, FULL, ORANGE), ASSETS / 'icon.png')
save(place(mark, 1024, ADAPTIVE), ASSETS / 'android-icon-foreground.png')
save(Image.new('RGBA', (1024, 1024), ORANGE), ASSETS / 'android-icon-background.png')
save(place(ink, 1024, ADAPTIVE), ASSETS / 'android-icon-monochrome.png')
# Launch screen stays plain paper: the in-app "GET IT DONE." intro (components/loading-screen.tsx) is the only loader.
BLANK = lambda size: Image.new('RGBA', (size, size), (0, 0, 0, 0))
save(BLANK(1024), ASSETS / 'splash-icon.png')
save(place(mark, 48, 0.8, ORANGE), ASSETS / 'favicon.png')

for dpi, scale in {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}.items():
    legacy, layer = round(48 * scale), round(108 * scale)
    folder = RES / f'mipmap-{dpi}'
    save(place(mark, legacy, FULL, ORANGE), folder / 'ic_launcher.webp')
    save(circle(place(mark, legacy, FULL * 0.92, ORANGE)), folder / 'ic_launcher_round.webp')
    save(place(mark, layer, ADAPTIVE), folder / 'ic_launcher_foreground.webp')
    save(Image.new('RGBA', (layer, layer), ORANGE), folder / 'ic_launcher_background.webp')
    save(place(ink, layer, ADAPTIVE), folder / 'ic_launcher_monochrome.webp')

    splash = RES / f'drawable-{dpi}' / 'splashscreen_logo.png'
    size = Image.open(splash).size[0] if splash.exists() else round(200 * scale)
    save(BLANK(size), splash)

print('icons written, background', '#%02x%02x%02x' % BG)
