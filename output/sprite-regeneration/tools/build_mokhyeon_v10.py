"""Build Mokhyeon v10 with a scale- and floor-locked death motion.

V10 preserves the approved idle and attack motions from v9.  The selected ten
death frames use the same painted character scale, with each pose authored
against one shared floor line before the common runtime transform is applied.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).with_name('build_mokhyeon_base.py')
SPEC = importlib.util.spec_from_file_location('build_mokhyeon_base', SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f'cannot load builder: {SCRIPT}')
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)

BUILDER.SOURCE = BUILDER.ROOT / 'output' / 'sprite-regeneration' / 'mokhyeon-v10'
BUILDER.OUTPUT = BUILDER.SOURCE
BUILDER.ROOT_X = 200
BUILDER.GROUND_Y = 642
BUILDER.ANCHOR = {
    'x': BUILDER.ROOT_X / BUILDER.CELL,
    'y': BUILDER.GROUND_Y / BUILDER.CELL,
}
BUILDER.BUILD_NAME = 'mokhyeon-v10'
BUILDER.STRICT_CANONICAL_SCALE = True
BUILDER.FIXED_CHARACTER_SCALE = 512 / 525
BUILDER.MOTION_FRAME_OFFSETS = {
    'idle': [
        (1, 0),
        (7, 0),
        (9, -1),
        (9, -1),
        (-2, 0),
        (-2, 0),
        (-2, 0),
        (-1, 0),
        (-1, 0),
        (0, 0),
        (1, 0),
        (0, 0),
    ],
    # The generator kept the correct character scale but placed the later
    # strips progressively higher inside their transparent source cells.
    # Translation-only offsets align each visible support contact to the same
    # packed-cell floor (y=650); they never resize or recenter the artwork.
    'death': [
        (0, 1),
        (0, 0),
        (0, 0),
        (0, 1),
        (0, 65),
        (0, 56),
        (0, 60),
        (0, 53),
        (0, 92),
        (0, 91),
    ],
}
BUILDER.VERIFICATION_NOTES = {
    'scaleReference': 'v9 idle and attack transition frames',
    'preservedMotions': ['idle', 'attack1', 'attack2'],
    'preservedAttackDesign': True,
    'retainedDeathStrips': [
        'death-part1',
        'death-part2',
        'death-part3',
    ],
    'sourceEdit': (
        'removed the previous death-part3 and renamed the previous '
        'death-part4 to death-part3; no new image generation'
    ),
    'diagnosedCause': (
        'v9 death artwork was painted about twenty percent larger than the '
        'approved motions, while independently generated strips used '
        'different local floor positions'
    ),
    'requestedSourceFloorY': 630,
    'observedSourceBottomRange': [558, 651],
    'packedFloorY': 650,
    'groundCorrection': 'translation only; no per-frame scaling',
    'runtimeScale': 0.5,
    'runtimeZoomLogic': False,
    'deathContinuity': (
        'frames 1-10 use one painted scale and one support-contact floor; '
        'frames 9-10 remain prone landing and hold poses'
    ),
}


if __name__ == '__main__':
    BUILDER.main()
