"""Build Mokhyeon v9 with attack strike frames at one character scale.

V8 proved that a single runtime scale does not correct camera-scale drift
already painted into separate generation strips.  V9 keeps the approved
attack choreography, idle and death, but replaces attack1/attack2 frames 9-12
with strips rendered at the same head and torso scale as the transition poses.
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

BUILDER.SOURCE = BUILDER.ROOT / 'output' / 'sprite-regeneration' / 'mokhyeon-v9'
BUILDER.OUTPUT = BUILDER.SOURCE
BUILDER.ROOT_X = 200
BUILDER.GROUND_Y = 642
BUILDER.ANCHOR = {
    'x': BUILDER.ROOT_X / BUILDER.CELL,
    'y': BUILDER.GROUND_Y / BUILDER.CELL,
}
BUILDER.BUILD_NAME = 'mokhyeon-v9'
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
}
BUILDER.VERIFICATION_NOTES = {
    'scaleReference': 'idle and attack transition frames',
    'preservedMotions': ['idle', 'death'],
    'preservedAttackDesign': True,
    'regeneratedStrips': ['attack1-part3', 'attack2-part3'],
    'diagnosedCause': (
        'separate four-frame generation strips painted the character at '
        'different camera scales; one shared runtime scale preserved that drift'
    ),
    'v8FaceWidthEvidencePx': {
        'idleRange': [138, 142],
        'attack1StartRange': [138, 146],
        'attack1StrikeRange': [86, 99],
        'attack2StartRange': [141, 148],
        'attack2StrikeRange': [74, 91],
    },
    'runtimeScale': 0.5,
    'runtimeZoomLogic': False,
    'v9FaceWidthEvidencePx': {
        'idleRange': [138, 142],
        'attack1StrikeFrames9To12': [125, 127, 123, 129],
        'attack2StrikeFrames9To12': [90, 132, 124, 114],
        'attack2Frame9Note': 'face partially occluded; width underestimates head size',
    },
    'runtimeValidation': {
        'idleToAttackScaleJump': False,
        'attackPeakCaptured': True,
        'idleHorizontalTravel': False,
        'browserWarningsOrErrors': 0,
    },
}


if __name__ == '__main__':
    BUILDER.main()
