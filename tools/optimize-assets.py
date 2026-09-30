"""Prepare a deployment copy with smaller, pixel-identical biome images."""
import shutil
from pathlib import Path

from PIL import Image, features

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "dist"
OUTPUT = ROOT / "_site"
BIOMES = ("garden", "desert", "ocean", "jungle", "hell")


def main():
    if not features.check("webp"):
        raise RuntimeError("Pillow must include WebP support")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(SOURCE, OUTPUT)
    replacements = {}
    total_before = 0
    total_after = 0
    for name in BIOMES:
        png = OUTPUT / "assets" / (name + ".png")
        webp = png.with_suffix(".webp")
        before = png.stat().st_size
        with Image.open(png) as image:
            original = image.convert("RGBA")
            original.save(webp, format="WEBP", lossless=True, exact=True, method=6)
            with Image.open(webp) as encoded:
                decoded = encoded.convert("RGBA")
                if decoded.size != original.size or decoded.tobytes() != original.tobytes():
                    raise RuntimeError("WebP pixel mismatch: " + name)
        after = webp.stat().st_size
        total_before += before
        if after < before:
            replacements["assets/" + name + ".png"] = "assets/" + name + ".webp"
            png.unlink()
            total_after += after
            print(f"{name}: {before:,} -> {after:,} bytes (lossless WebP)")
        else:
            webp.unlink()
            total_after += before
            print(f"{name}: keeping PNG ({before:,} bytes)")
    for file in OUTPUT.rglob("*"):
        if file.suffix not in (".html", ".css", ".js"):
            continue
        content = file.read_text(encoding="utf-8")
        for old, new in replacements.items():
            content = content.replace(old, new)
        # app.js constructs the biome paths instead of storing full URLs.
        if file == OUTPUT / "app.js" and replacements:
            old = "['garden', 'desert', 'ocean', 'jungle', 'hell'].map(name => 'assets/' + name + '.png')"
            optimized = ", ".join(repr(replacements.get("assets/" + name + ".png", "assets/" + name + ".png")) for name in BIOMES)
            if old not in content:
                raise RuntimeError("Biome path declaration changed; update the optimizer")
            content = content.replace(old, "[" + optimized + "]")
        file.write_text(content, encoding="utf-8")
    saved = total_before - total_after
    print(f"Biome assets: {total_before:,} -> {total_after:,} bytes; saved {saved:,} ({saved / total_before:.1%})")


if __name__ == "__main__":
    main()
