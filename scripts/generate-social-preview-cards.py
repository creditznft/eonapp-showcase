from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'media' / 'social'
OUT.mkdir(parents=True, exist_ok=True)

FAMILIES = {
    'home': {'title': 'EONAPP', 'subtitle': 'Chat-first AI workspace, tools and guided actions', 'accent': (89, 224, 255), 'secondary': (255, 191, 96), 'glow': (58, 122, 255)},
    'city': {'title': 'EON CITY', 'subtitle': 'Review-first living city with districts, transit and discovery', 'accent': (86, 226, 214), 'secondary': (255, 180, 93), 'glow': (65, 207, 255)},
    'nexus': {'title': 'EON NEXUS', 'subtitle': 'Morphic command field with bounded multimodal control', 'accent': (184, 117, 255), 'secondary': (117, 247, 255), 'glow': (91, 75, 255)},
    'forge': {'title': 'FORGE', 'subtitle': 'Build, validate and continue projects with visible review', 'accent': (255, 156, 58), 'secondary': (94, 230, 255), 'glow': (255, 101, 47)},
    'ai': {'title': 'LOCAL AI', 'subtitle': 'Hosted and on-device runtime guidance with clear boundaries', 'accent': (112, 255, 176), 'secondary': (101, 196, 255), 'glow': (47, 203, 138)},
    'trust': {'title': 'TRUST & ACCESS', 'subtitle': 'Identity, sharing, plans and receipts with product truth', 'accent': (255, 198, 96), 'secondary': (130, 233, 255), 'glow': (204, 134, 55)},
}

SIZES = {
    'wide': ((1200, 630), '1200x630'),
    'square': ((1080, 1080), '1080x1080'),
}

try:
    title_font = ImageFont.truetype('DejaVuSans-Bold.ttf', 86)
    subtitle_font = ImageFont.truetype('DejaVuSans.ttf', 34)
    tiny_font = ImageFont.truetype('DejaVuSans.ttf', 24)
except Exception:
    title_font = ImageFont.load_default()
    subtitle_font = ImageFont.load_default()
    tiny_font = ImageFont.load_default()


def blend(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def paint_card(size, family_key, aspect_key):
    w, h = size
    fam = FAMILIES[family_key]
    img = Image.new('RGB', size, (7, 16, 32))
    px = img.load()
    base_top = (8, 20, 40)
    base_bottom = (15, 9, 28)
    for y in range(h):
        t = y / max(1, h - 1)
        row = blend(base_top, base_bottom, t)
        for x in range(w):
            vignette = 1 - (math.hypot((x - w / 2) / w, (y - h / 2) / h) * 0.9)
            vignette = max(0.45, min(1.0, vignette))
            px[x, y] = tuple(int(c * vignette) for c in row)

    draw = ImageDraw.Draw(img, 'RGBA')
    accent = fam['accent']
    secondary = fam['secondary']
    glow = fam['glow']

    # soft glows
    glow_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer, 'RGBA')
    circles = [
        (int(w*0.18), int(h*0.22), int(min(w, h)*0.28), (*accent, 90)),
        (int(w*0.78), int(h*0.18), int(min(w, h)*0.22), (*secondary, 75)),
        (int(w*0.72), int(h*0.72), int(min(w, h)*0.3), (*glow, 70)),
    ]
    for cx, cy, r, fill in circles:
        glow_draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=fill)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=max(14, int(min(w, h)*0.03))))
    img = Image.alpha_composite(img.convert('RGBA'), glow_layer)
    draw = ImageDraw.Draw(img, 'RGBA')

    # frame and route motifs
    pad = int(min(w, h) * 0.045)
    draw.rounded_rectangle((pad, pad, w-pad, h-pad), radius=int(min(w,h)*0.04), outline=(*accent, 170), width=max(3, int(min(w,h)*0.004)))
    for idx in range(4):
        ox = pad + idx * (w - pad*2) / 3
        draw.line((ox, pad + h*0.08, ox + w*0.08, h - pad - h*0.08), fill=(*secondary, 36), width=2)
    for idx in range(6):
        y = pad + idx * (h - pad*2) / 5
        draw.line((pad + w*0.08, y, w - pad - w*0.08, y + h*0.02), fill=(*accent, 25), width=1)

    # icon motif
    cx, cy = int(w*0.16), int(h*0.48 if aspect_key == 'wide' else h*0.24)
    motif_layer = Image.new('RGBA', size, (0,0,0,0))
    motif = ImageDraw.Draw(motif_layer, 'RGBA')
    for scale, color, alpha in [(1.0, accent, 190), (0.72, secondary, 175), (0.44, glow, 190)]:
        r = int(min(w, h) * 0.12 * scale)
        motif.ellipse((cx-r, cy-r, cx+r, cy+r), outline=(*color, alpha), width=max(3, int(min(w,h)*0.006)))
    motif.polygon([(cx, cy-int(min(w,h)*0.03)), (cx+int(min(w,h)*0.04), cy+int(min(w,h)*0.03)), (cx-int(min(w,h)*0.04), cy+int(min(w,h)*0.03))], fill=(*secondary, 110))
    motif_layer = motif_layer.filter(ImageFilter.GaussianBlur(radius=1))
    img = Image.alpha_composite(img, motif_layer)
    draw = ImageDraw.Draw(img, 'RGBA')

    text_x = int(w*0.28 if aspect_key == 'wide' else w*0.12)
    title_y = int(h*0.27 if aspect_key == 'wide' else h*0.48)
    subtitle_y = title_y + 110
    draw.text((text_x, title_y), fam['title'], font=title_font, fill=(245, 250, 255, 255))
    draw.text((text_x, subtitle_y), fam['subtitle'], font=subtitle_font, fill=(209, 225, 240, 240), spacing=8)

    chip_text = 'eonapp.ch'
    chip_w = int(w*0.16 if aspect_key == 'wide' else w*0.25)
    chip_h = 42
    chip_x = text_x
    chip_y = subtitle_y + 70
    draw.rounded_rectangle((chip_x, chip_y, chip_x + chip_w, chip_y + chip_h), radius=18, fill=(*accent, 55), outline=(*accent, 140), width=2)
    tw = draw.textbbox((0,0), chip_text, font=tiny_font)
    draw.text((chip_x + (chip_w - (tw[2]-tw[0]))/2, chip_y + 8), chip_text, font=tiny_font, fill=(246,250,255,255))

    footer = 'Review-first • Local-safe • No automatic execution'
    box_h = 54
    draw.rounded_rectangle((pad + 14, h - pad - box_h, w - pad - 14, h - pad - 8), radius=18, fill=(10,18,34,172), outline=(*secondary, 120), width=2)
    fb = draw.textbbox((0,0), footer, font=tiny_font)
    draw.text(((w - (fb[2]-fb[0]))/2, h - pad - box_h + 13), footer, font=tiny_font, fill=(226, 237, 246, 240))

    return img.convert('RGB')


def main():
    generated = []
    for key in FAMILIES:
        for aspect_key, (size, suffix) in SIZES.items():
            name = f'eonapp-{key}-{suffix}-social-v1.png'
            path = OUT / name
            paint_card(size, key, aspect_key).save(path, 'PNG', optimize=True)
            generated.append(path)
    print(f'generated {len(generated)} cards')
    for path in generated:
        print(path.relative_to(ROOT))

if __name__ == '__main__':
    main()
