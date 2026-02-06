#!/usr/bin/env python3
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:
    raise SystemExit(
        "Pillow is required. Install it with: python3 -m pip install -r scripts/requirements.txt"
    ) from exc

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONT_PATH = (
    ROOT
    / "node_modules"
    / "@expo"
    / "vector-icons"
    / "build"
    / "vendor"
    / "react-native-vector-icons"
    / "Fonts"
    / "MaterialIcons.ttf"
)

MAP_GLYPH = chr(58715)  # MaterialIcons "map"
BLUE = "#135bec"
WHITE = "#ffffff"


def centered_text(draw: ImageDraw.ImageDraw, rect: tuple[int, int, int, int], text: str, font: ImageFont.FreeTypeFont, fill: str):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x0, y0, x1, y1 = rect
    x = x0 + (x1 - x0 - tw) / 2
    y = y0 + (y1 - y0 - th) / 2 - bbox[1] * 0.02
    draw.text((x, y), text, font=font, fill=fill)


def rounded_badge_icon(size: int, bg: str, badge_ratio: float, radius_ratio: float, glyph_ratio: float, transparent_bg: bool):
    mode = "RGBA"
    base = (0, 0, 0, 0) if transparent_bg else bg
    image = Image.new(mode, (size, size), base)
    draw = ImageDraw.Draw(image)

    badge_size = int(size * badge_ratio)
    corner = int(badge_size * radius_ratio)
    margin = (size - badge_size) // 2
    rect = (margin, margin, margin + badge_size, margin + badge_size)

    draw.rounded_rectangle(rect, radius=corner, fill=BLUE)

    font_size = int(badge_size * glyph_ratio)
    font = ImageFont.truetype(str(FONT_PATH), font_size)
    centered_text(draw, rect, MAP_GLYPH, font, WHITE)

    return image


def main():
    if not FONT_PATH.exists():
        raise SystemExit(f"MaterialIcons font not found: {FONT_PATH}")

    icon = rounded_badge_icon(
        size=1024,
        bg=WHITE,
        badge_ratio=0.78,
        radius_ratio=0.28,
        glyph_ratio=0.54,
        transparent_bg=False,
    )
    icon.save(ASSETS / "icon.png", "PNG")

    adaptive = rounded_badge_icon(
        size=1024,
        bg=WHITE,
        badge_ratio=0.66,
        radius_ratio=0.28,
        glyph_ratio=0.54,
        transparent_bg=True,
    )
    adaptive.save(ASSETS / "adaptive-icon.png", "PNG")

    favicon = icon.resize((48, 48), Image.Resampling.LANCZOS)
    favicon.save(ASSETS / "favicon.png", "PNG")

    print("Generated icon assets:")
    print("- assets/icon.png")
    print("- assets/adaptive-icon.png")
    print("- assets/favicon.png")


if __name__ == "__main__":
    main()
