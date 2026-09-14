#!/usr/bin/env python3
"""
Turn Purdue DTM tiles into a slippy-map XYZ pyramid of Local Relief Model
shading, so the canopy peel works across the whole county instead of one
hardcoded rectangle.

The old way was a single lrm_overlay.png pinned to a bbox -- about one square
mile out of three hundred and thirty six. This writes real web tiles.

Usage:
  python3 make_lrm_tiles.py --dtm-dir /workspace/dem_tiles \
                            --out public/lrm_tiles \
                            --zooms 14-18

Output: public/lrm_tiles/{z}/{x}/{y}.png  -> serve as an XYZ layer.
"""
import argparse, math, os, sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, transform_bounds
from rasterio.transform import from_bounds
from scipy import ndimage as ndi
from PIL import Image

TILE = 256
WEBM = "EPSG:3857"


# ---------- LRM ----------

def local_relief(z, cell_ft, sigma_ft=22.0):
    """DTM minus a smoothed DTM. Strips the hillslope, keeps the micro-relief."""
    return z - ndi.gaussian_filter(z, sigma_ft / cell_ft, mode="nearest")


def hillshade(z, cell_ft, az=315.0, alt=45.0, ve=3.0):
    dy, dx = np.gradient(z * ve, cell_ft)
    slope = np.pi / 2 - np.arctan(np.hypot(dx, dy))
    aspect = np.arctan2(-dx, dy)
    a, zen = np.radians(az), np.radians(alt)
    return np.clip(np.sin(zen) * np.sin(slope) +
                   np.cos(zen) * np.cos(slope) * np.cos(a - aspect), 0, 1)


def shade_rgba(z, cell_ft):
    """Blend LRM with a hillshade. Grey base, warm on mounds, cool in hollows."""
    r = local_relief(z, cell_ft)
    hs = hillshade(z, cell_ft)

    lim = np.nanpercentile(np.abs(r), 98) or 1.0
    t = np.clip(r / lim, -1, 1)

    base = 0.45 + 0.55 * hs                       # structure from the hillshade
    red = base + 0.35 * np.clip(t, 0, 1)          # raised -> warm
    blue = base + 0.35 * np.clip(-t, 0, 1)        # sunken -> cool
    green = base + 0.10 * np.abs(t)

    rgb = np.stack([red, green, blue], 0)
    rgb = np.clip(rgb, 0, 1)
    out = (rgb * 255).astype(np.uint8)
    alpha = np.where(np.isfinite(z), 255, 0).astype(np.uint8)
    return np.vstack([out, alpha[None, ...]])


# ---------- XYZ math ----------

def lonlat_to_tile(lon, lat, z):
    n = 2 ** z
    x = int((lon + 180.0) / 360.0 * n)
    lat_r = math.radians(max(min(lat, 85.05112878), -85.05112878))
    y = int((1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n)
    return x, y


def tile_bounds_3857(x, y, z):
    C = 20037508.342789244
    span = 2 * C / (2 ** z)
    return (-C + x * span, C - (y + 1) * span, -C + (x + 1) * span, C - y * span)


# ---------- main ----------

def process(dtm_path, out_dir, zooms, cell_ft):
    with rasterio.open(dtm_path) as src:
        z = src.read(1).astype(np.float32)
        nod = src.nodata
        src_crs, src_tr = src.crs, src.transform
        left, bottom, right, top = src.bounds

    bad = ~np.isfinite(z)
    if nod is not None:
        bad |= (z <= nod + 1) | (z < -1e30)
    z[bad] = np.nan

    if np.isnan(z).all():
        return 0
    # fill holes so the gaussian doesn't smear NaN across the tile
    filled = z.copy()
    if np.isnan(filled).any():
        idx = ndi.distance_transform_edt(np.isnan(filled),
                                         return_distances=False, return_indices=True)
        filled = filled[tuple(idx)]

    rgba = shade_rgba(filled, cell_ft)
    rgba[3][bad] = 0

    w, s, e, n = transform_bounds(src_crs, "EPSG:4326", left, bottom, right, top)

    written = 0
    for zoom in zooms:
        x0, y0 = lonlat_to_tile(w, n, zoom)
        x1, y1 = lonlat_to_tile(e, s, zoom)
        for tx in range(min(x0, x1), max(x0, x1) + 1):
            for ty in range(min(y0, y1), max(y0, y1) + 1):
                tb = tile_bounds_3857(tx, ty, zoom)
                dst_tr = from_bounds(*tb, TILE, TILE)
                dst = np.zeros((4, TILE, TILE), np.uint8)
                for b in range(4):
                    reproject(
                        source=rgba[b], destination=dst[b],
                        src_transform=src_tr, src_crs=src_crs,
                        dst_transform=dst_tr, dst_crs=WEBM,
                        resampling=Resampling.bilinear,
                        src_nodata=0 if b == 3 else None,
                    )
                if not dst[3].any():
                    continue
                p = Path(out_dir) / str(zoom) / str(tx)
                p.mkdir(parents=True, exist_ok=True)
                fp = p / f"{ty}.png"
                img = Image.fromarray(np.transpose(dst, (1, 2, 0)), "RGBA")
                if fp.exists():          # another DTM already painted part of this tile
                    old = Image.open(fp).convert("RGBA")
                    img = Image.alpha_composite(old, img)
                img.save(fp, optimize=True)
                written += 1
    return written


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dtm-dir", required=True)
    ap.add_argument("--out", default="public/lrm_tiles")
    ap.add_argument("--zooms", default="14-18")
    ap.add_argument("--cell-ft", type=float, default=2.5,
                    help="DTM cell size in feet (Purdue QL2 = 2.5)")
    ap.add_argument("--glob", default="*.img")
    a = ap.parse_args()

    lo, hi = (int(v) for v in a.zooms.split("-")) if "-" in a.zooms else (int(a.zooms),) * 2
    zooms = list(range(lo, hi + 1))

    files = sorted(Path(a.dtm_dir).glob(a.glob))
    if not files:
        sys.exit(f"no DTMs matching {a.glob} in {a.dtm_dir}")

    total = 0
    for i, f in enumerate(files, 1):
        n = process(f, a.out, zooms, a.cell_ft)
        total += n
        print(f"[{i}/{len(files)}] {f.name} -> {n} tiles", flush=True)
    print(f"\ndone: {total} tiles under {a.out}/  (zooms {lo}-{hi})")


if __name__ == "__main__":
    main()
