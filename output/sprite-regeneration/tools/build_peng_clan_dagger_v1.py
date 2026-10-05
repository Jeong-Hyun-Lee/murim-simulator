"""Build the globally scale- and ground-locked Peng Clan dagger v1 atlas."""

from __future__ import annotations

import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).with_name('build_hyeollangchae_boss_v3.py')
SPEC = importlib.util.spec_from_file_location('build_hyeollangchae_boss_v3', SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f'cannot load builder: {SCRIPT}')
BOSS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BOSS)
BUILDER = BOSS.BUILDER

BUILDER.SOURCE = BUILDER.ROOT / 'output' / 'sprite-regeneration' / 'peng-clan-dagger-v1'
BUILDER.OUTPUT = BUILDER.SOURCE
BUILDER.CELL = 896
BUILDER.ROOT_X = 596
BUILDER.GROUND_Y = 770
BUILDER.ANCHOR = {
    'x': BUILDER.ROOT_X / BUILDER.CELL,
    'y': BUILDER.GROUND_Y / BUILDER.CELL,
}
BUILDER.BUILD_NAME = 'peng-clan-dagger-v1'
BUILDER.FRAME_PREFIX = 'peng-clan-dagger-v1'
BUILDER.STRICT_CANONICAL_SCALE = True
BUILDER.FIXED_CHARACTER_SCALE = 0.93
BUILDER.extract_frames = BOSS.extract_ordered_frames
BUILDER.render_motion = BOSS.render_ground_locked
BUILDER.VERIFICATION_NOTES = {
    'character': 'Peng Clan flying-dagger specialist',
    'globalMotionPlan': 'four-motion master board before production strips',
    'motionCounts': {'idle': 12, 'attack1': 16, 'attack2': 16, 'death': 10},
    'singleGlobalScale': True,
    'perFrameScaling': False,
    'perMotionScaling': False,
    'groundLock': 'actual support-contact alpha translated to packed y=770',
    'rootLock': 'right-side support axis translated to packed x=596',
    'orientation': 'screen-left; source artwork is never mirrored',
    'runtimeScale': 0.45,
    'runtimeZoomLogic': False,
    'attack1ContactFrame': 8,
    'attack2ContactFrame': 8,
}


if __name__ == '__main__':
    BUILDER.main()
