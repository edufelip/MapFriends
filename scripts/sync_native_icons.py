#!/usr/bin/env python3
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError as exc:
    raise SystemExit(
        "Pillow is required. Install it with: python3 -m pip install -r scripts/requirements.txt"
    ) from exc

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
IOS_ICON = ROOT / "ios" / "mapfriends" / "Images.xcassets" / "AppIcon.appiconset" / "App-Icon-1024x1024@1x.png"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"

ICON_SRC = Image.open(ASSETS / "icon.png").convert("RGBA")
ADAPTIVE_SRC = Image.open(ASSETS / "adaptive-icon.png").convert("RGBA")

# iOS: single universal 1024 icon used by current Expo-generated AppIcon set.
ICON_SRC.resize((1024, 1024), Image.Resampling.LANCZOS).save(IOS_ICON, "PNG")

legacy_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

foreground_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

for folder, size in legacy_sizes.items():
    out_dir = ANDROID_RES / folder
    out_dir.mkdir(parents=True, exist_ok=True)

    square = ICON_SRC.resize((size, size), Image.Resampling.LANCZOS)
    square.save(out_dir / "ic_launcher.webp", "WEBP", quality=95, method=6)

    # Round launcher variant.
    round_icon = square.copy()
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    round_icon.putalpha(mask)
    round_icon.save(out_dir / "ic_launcher_round.webp", "WEBP", quality=95, method=6)

for folder, size in foreground_sizes.items():
    out_dir = ANDROID_RES / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    fg = ADAPTIVE_SRC.resize((size, size), Image.Resampling.LANCZOS)
    fg.save(out_dir / "ic_launcher_foreground.webp", "WEBP", quality=95, method=6)

print("Native icon files updated:")
print(f"- {IOS_ICON.relative_to(ROOT)}")
for folder in legacy_sizes:
    print(f"- android/app/src/main/res/{folder}/ic_launcher.webp")
    print(f"- android/app/src/main/res/{folder}/ic_launcher_round.webp")
    print(f"- android/app/src/main/res/{folder}/ic_launcher_foreground.webp")
