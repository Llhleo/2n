"""Verify deployed HTML, CSS, scripts and biome images against a checked site."""
import pathlib
import sys
import time
import urllib.parse
import urllib.request

site = pathlib.Path(sys.argv[1])
base = sys.argv[2].rstrip("/") + "/"
paths = [pathlib.Path("index.html"), pathlib.Path("style.css")]
paths += [path.relative_to(site) for path in sorted(site.glob("*.js"))]
for name in ("garden", "desert", "ocean", "jungle", "hell"):
    paths.append(next(path.relative_to(site) for path in (site / "assets").glob(name + ".*") if path.suffix in (".png", ".webp")))

for path in paths:
    expected = (site / path).read_bytes()
    url = base + urllib.parse.quote(path.as_posix())
    for attempt in range(12):
        try:
            request = urllib.request.Request(url + "?verify=" + str(time.time_ns()))
            with urllib.request.urlopen(request, timeout=20) as response:
                actual = response.read()
            if actual == expected:
                print("Verified:", url, flush=True)
                break
        except Exception as error:
            print(type(error).__name__, str(error), flush=True)
        if attempt < 11:
            time.sleep(5)
    else:
        raise SystemExit("Published content did not match: " + url)
