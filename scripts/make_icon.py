#!/usr/bin/env python3
"""Generate launcher icons (rounded square, indigo gradient, white 'A')."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "app", "src", "main", "res")

FONT = "C:/Windows/Fonts/arialbd.ttf"

# vertical gradient indigo -> blue
TOP = (67, 56, 202)     # #4338CA
BOT = (37, 99, 235)     # #2563EB


def make_icon(px):
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    m = int(px * 0.06)
    box = [m, m, px - m, px - m]
    radius = int((px - 2 * m) * 0.22)

    # gradient rounded rect
    grad = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(m, px - m):
        t = (y - m) / max(1, (px - 2 * m))
        r = int(TOP[0] + (BOT[0] - TOP[0]) * t)
        g = int(TOP[1] + (BOT[1] - TOP[1]) * t)
        b = int(TOP[2] + (BOT[2] - TOP[2]) * t)
        gd.line([m, y, px - m, y], fill=(r, g, b, 255))
    mask = Image.new("L", (px, px), 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=radius, fill=255)
    img.paste(grad, (0, 0), mask)

    # white "A"
    fs = int(px * 0.58)
    try:
        font = ImageFont.truetype(FONT, fs)
    except Exception:
        font = ImageFont.load_default()
    text = "A"
    # measure via bbox
    bbox = d.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (px - w) / 2 - bbox[0]
    y = (px - h) / 2 - bbox[1]
    # subtle vertical offset for optical centering
    d.text((x, y - int(px * 0.01)), text, font=font, fill=(255, 255, 255, 255))
    return img


sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for dpi, px in sizes.items():
    outdir = os.path.join(RES, f"mipmap-{dpi}")
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, "ic_launcher.png")
    make_icon(px).save(out)
    print("wrote", out)
