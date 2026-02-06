#!/usr/bin/env python3
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit(
        "Pillow is required. Install it with: python3 -m pip install -r scripts/requirements.txt"
    ) from exc

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
IOS_SPLASH = ROOT / "ios" / "mapfriends" / "Images.xcassets" / "SplashScreenLegacy.imageset"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"

SOURCE = Image.open(ASSETS / "adaptive-icon.png").convert("RGBA")

# Expo config splash source asset.
SOURCE.resize((1024, 1024), Image.Resampling.LANCZOS).save(ASSETS / "splash-icon.png", "PNG")

# iOS legacy splash imageset (storyboard uses this named image in aspectFit).
for name, size in (("image.png", 1024), ("image@2x.png", 1024), ("image@3x.png", 1024)):
    SOURCE.resize((size, size), Image.Resampling.LANCZOS).save(IOS_SPLASH / name, "PNG")

# Android native splash logo densities used by @drawable/splashscreen_logo.
sizes = {
    "drawable-mdpi": 288,
    "drawable-hdpi": 432,
    "drawable-xhdpi": 576,
    "drawable-xxhdpi": 864,
    "drawable-xxxhdpi": 1152,
}

for folder, size in sizes.items():
    out = ANDROID_RES / folder / "splashscreen_logo.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    SOURCE.resize((size, size), Image.Resampling.LANCZOS).save(out, "PNG")

print("Native splash assets synced:")
print("- assets/splash-icon.png")
print("- ios/mapfriends/Images.xcassets/SplashScreenLegacy.imageset/image*.png")
for folder in sizes:
    print(f"- android/app/src/main/res/{folder}/splashscreen_logo.png")
