from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


CELL_SIZE = 768
ROOT_X = 192
GROUND_Y = 624
TARGET_HEIGHT = 512
PADDING = 2
ATLAS_WIDTH = 4096
ANCHOR = {"x": 0.25, "y": 0.8125}
MOTIONS = (
    ("idle", 12, 80),
    ("attack1", 16, 45),
    ("attack2", 16, 45),
    ("death", 14, None),
)

ROOT = Path(__file__).resolve().parents[3]
SOURCE_DIR = ROOT / "wiki" / "raw" / "assets"
OUTPUT_DIR = ROOT / "output" / "sprite-regeneration" / "mokhyeon-v3"
ASSET_DIR = ROOT / "assets" / "sprites" / "character"
SOURCES = {
    "idle": SOURCE_DIR / "mokhyeon-v3-idle-strip-candidate.png",
    "attack1": SOURCE_DIR / "mokhyeon-v3-attack1-strip-candidate.png",
    "attack2": SOURCE_DIR / "mokhyeon-v3-attack2-strip-candidate.png",
    "death": SOURCE_DIR / "mokhyeon-v3-death-strip-candidate.png",
}


def extract_subjects():
    subjects = []
    for motion, count, duration in MOTIONS:
        image = Image.open(SOURCES[motion]).convert("RGBA")
        for index in range(count):
            left = round(index * image.width / count)
            right = round((index + 1) * image.width / count)
            cell = image.crop((left, 0, right, image.height))
            bounds = cell.getchannel("A").getbbox()
            if not bounds:
                raise ValueError(f"{motion} {index} has no opaque pixels")
            subjects.append(
                {
                    "motion": motion,
                    "index": index,
                    "duration": duration,
                    "image": cell.crop(bounds),
                }
            )
    return subjects


def normalize(subjects):
    maximum_height = max(subject["image"].height for subject in subjects)
    maximum_width = max(subject["image"].width for subject in subjects)
    scale = min(TARGET_HEIGHT / maximum_height, 704 / maximum_width)
    for subject in subjects:
        image = subject["image"]
        resized = image.resize(
            (round(image.width * scale), round(image.height * scale)),
            Image.Resampling.LANCZOS,
        )
        cell = Image.new("RGBA", (CELL_SIZE, CELL_SIZE))
        left = max(32, min(CELL_SIZE - 32 - resized.width, ROOT_X - round(resized.width * 0.30)))
        top = max(32, GROUND_Y - resized.height)
        cell.alpha_composite(resized, (left, top))
        subject["cell"] = cell
        subject["bounds"] = cell.getchannel("A").getbbox()
    return scale


def write_review_sheet(subjects):
    review = Image.new("RGBA", (CELL_SIZE * 16, CELL_SIZE * 4))
    row_by_motion = {motion: row for row, (motion, _, _) in enumerate(MOTIONS)}
    for subject in subjects:
        review.alpha_composite(
            subject["cell"],
            (subject["index"] * CELL_SIZE, row_by_motion[subject["motion"]] * CELL_SIZE),
        )
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    review.save(OUTPUT_DIR / "mokhyeon-v3-cells.png")

    preview = review.resize((1536, 384), Image.Resampling.LANCZOS)
    preview.save(OUTPUT_DIR / "mokhyeon-v3-cells-preview.png")


def pack(subjects):
    packed = []
    x = PADDING
    y = PADDING
    row_height = 0
    used_width = 0
    for subject in subjects:
        left, top, right, bottom = subject["bounds"]
        cropped = subject["cell"].crop((left, top, right, bottom))
        if x + cropped.width + PADDING > ATLAS_WIDTH:
            x = PADDING
            y += row_height + PADDING
            row_height = 0
        if y + cropped.height + PADDING > ATLAS_WIDTH:
            raise ValueError("Atlas exceeds 4096px; reduce common sprite scale")
        subject["packed"] = (x, y, cropped)
        packed.append(subject)
        used_width = max(used_width, x + cropped.width + PADDING)
        row_height = max(row_height, cropped.height)
        x += cropped.width + PADDING

    height = y + row_height + PADDING
    atlas = Image.new("RGBA", (used_width, height))
    for subject in packed:
        frame_x, frame_y, cropped = subject["packed"]
        atlas.alpha_composite(cropped, (frame_x, frame_y))
    return atlas


def make_metadata(subjects, atlas):
    frames = {}
    animations = {}
    for subject in subjects:
        motion = subject["motion"]
        index = subject["index"]
        frame_x, frame_y, cropped = subject["packed"]
        left, top, _, _ = subject["bounds"]
        duration = subject["duration"]
        if motion == "death":
            duration = 360 if index == 13 else 720 / 13
        name = f"mokhyeon/{motion}/{index}"
        frames[name] = {
            "frame": {"x": frame_x, "y": frame_y, "w": cropped.width, "h": cropped.height},
            "rotated": False,
            "trimmed": True,
            "spriteSourceSize": {"x": left, "y": top, "w": cropped.width, "h": cropped.height},
            "sourceSize": {"w": CELL_SIZE, "h": CELL_SIZE},
            "anchor": ANCHOR,
            "duration": duration,
        }
        animations.setdefault(f"mokhyeon/{motion}", []).append(name)
    return {
        "frames": frames,
        "animations": animations,
        "meta": {
            "app": "murim-simulator",
            "version": "3",
            "image": "mokhyeon-v3-sheet.png",
            "format": "RGBA8888",
            "size": {"w": atlas.width, "h": atlas.height},
            "scale": "1",
        },
    }


def write_gifs(subjects):
    for motion, _, _ in MOTIONS:
        sequence = [subject for subject in subjects if subject["motion"] == motion]
        images = [subject["cell"] for subject in sequence]
        durations = [subject["duration"] if subject["duration"] is not None else (360 if subject["index"] == 13 else round(720 / 13)) for subject in sequence]
        images[0].save(
            OUTPUT_DIR / f"mokhyeon-v3-{motion}.gif",
            save_all=True,
            append_images=images[1:],
            duration=durations,
            loop=0,
            disposal=2,
            transparency=0,
        )
        images[0].save(
            OUTPUT_DIR / f"mokhyeon-v3-{motion}-slow.gif",
            save_all=True,
            append_images=images[1:],
            duration=[value * 2 for value in durations],
            loop=0,
            disposal=2,
            transparency=0,
        )


def main():
    subjects = extract_subjects()
    scale = normalize(subjects)
    write_review_sheet(subjects)
    atlas = pack(subjects)
    metadata = make_metadata(subjects, atlas)
    write_gifs(subjects)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    atlas.save(ASSET_DIR / "mokhyeon-v3-sheet.png")
    (ASSET_DIR / "mokhyeon-v3-sheet.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"frames={len(subjects)} scale={scale:.4f} atlas={atlas.width}x{atlas.height}")


if __name__ == "__main__":
    main()
