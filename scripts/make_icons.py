from PIL import Image, ImageDraw
import os

OUT = "/app/frontend/public/icons"
os.makedirs(OUT, exist_ok=True)

INK = (13, 20, 36, 255)
PAPER = (255, 255, 255, 255)
LINE = (196, 205, 219, 255)
ACCENT = (37, 99, 235, 255)

SS = 4  # supersampling


def draw_mark(draw, cx, cy, size):
    """Receipt mark centered at (cx, cy) with bounding size."""
    w = size * 0.62
    h = size * 0.80
    x0 = cx - w / 2
    y0 = cy - h / 2
    x1 = cx + w / 2
    y1 = cy + h / 2
    r = size * 0.06
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=PAPER)

    # zigzag bottom edge (carve with background colour)
    teeth = 6
    tw = w / teeth
    th = size * 0.07
    for i in range(teeth):
        left = x0 + i * tw
        draw.polygon(
            [(left, y1 + 2), (left + tw / 2, y1 - th), (left + tw, y1 + 2)],
            fill=INK,
        )

    pad = w * 0.14
    line_h = size * 0.045
    widths = [0.72, 0.52, 0.72]
    for idx, ratio in enumerate(widths):
        ly = y0 + h * (0.20 + idx * 0.16)
        draw.rounded_rectangle(
            [x0 + pad, ly, x0 + pad + (w - 2 * pad) * ratio, ly + line_h],
            radius=line_h / 2,
            fill=LINE,
        )
    ly = y0 + h * 0.70
    draw.rounded_rectangle(
        [x0 + pad, ly, x0 + pad + (w - 2 * pad) * 0.58, ly + line_h * 1.7],
        radius=line_h,
        fill=ACCENT,
    )


def make(size, path, rounded=True, mark_scale=1.0):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if rounded:
        draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=INK)
    else:
        draw.rectangle([0, 0, s, s], fill=INK)
    draw_mark(draw, s / 2, s / 2, s * mark_scale)
    img = img.resize((size, size), Image.LANCZOS)
    img.save(path)
    print("wrote", path)


make(512, f"{OUT}/icon-512.png", rounded=True, mark_scale=0.70)
make(192, f"{OUT}/icon-192.png", rounded=True, mark_scale=0.70)
make(512, f"{OUT}/maskable-512.png", rounded=False, mark_scale=0.52)
make(180, f"{OUT}/apple-touch-icon-180.png", rounded=False, mark_scale=0.68)
make(64, f"{OUT}/favicon-64.png", rounded=True, mark_scale=0.78)
