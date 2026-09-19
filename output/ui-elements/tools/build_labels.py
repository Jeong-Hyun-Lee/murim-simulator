from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parents[3]
OUT = ROOT / 'assets/ui/label'
SRC = ROOT / 'output/ui-elements/source'
FONT = ROOT / 'assets/fonts/ui-labels/NanumMyeongjo-ExtraBold.ttf'

LABELS = {
    'label-train-once': ('1회 연마', 'ink'), 'label-train': ('연마', 'cream'),
    'label-confirm': ('확인', 'ink'), 'label-cancel': ('취소', 'cream'),
    'label-pause': ('전투 일시정지', 'ink'), 'label-resume': ('전투 재개', 'ink'),
    'label-sfx-on': ('효과음 켜기', 'cream'), 'label-sfx-off': ('효과음 끄기', 'cream'),
    'label-battle-view': ('전투 보기', 'cream'), 'label-stage': ('사냥터', 'cream'),
    'label-climb': ('등반', 'cream'), 'label-boss-challenge': ('도전', 'ink'),
    'label-keep-training': ('수련하기', 'cream'), 'label-continue': ('계속하기', 'ink'),
    'label-goals': ('수련 목표', 'cream'), 'label-tower': ('수련탑', 'cream'),
    'label-tower-quit': ('포기', 'cream'), 'label-claim': ('받기', 'ink'),
    'label-claimed': ('받음', 'cream'), 'label-goal-progress': ('진행 중', 'cream'),
    'title-settings': ('설정', 'cream'), 'title-currency': ('보유 재화', 'cream'),
    'title-boss-challenge': ('보스 도전', 'cream'), 'title-boss-defeated': ('보스 격파', 'cream'),
    'title-locked-gong': ('무공 잠김', 'cream'), 'title-locked-gear': ('장비 잠김', 'cream'),
    'title-locked-sect': ('문파 잠김', 'cream'), 'title-locked-shop': ('상점 잠김', 'cream'),
    'section-goal-daily': ('일일 수련', 'ink'), 'section-goal-milestone': ('누적 수련', 'ink'),
    'label-next': ('다음', 'ink'), 'label-skip': ('건너뛰기', 'cream'),
    'label-use-default': ('기본값 사용', 'cream'), 'label-equip-best': ('최적 장착', 'ink'),
    'label-disassemble-select': ('분해 선택', 'cream'), 'label-disassemble': ('분해하기', 'cream'),
    'label-select-all': ('전체 선택', 'cream'), 'label-deselect-all': ('전체 해제', 'cream'),
    'label-equip': ('장착', 'ink'), 'label-unequip': ('해제', 'cream'),
    'label-enhance': ('강화하기', 'ink'), 'label-donate-chi': ('내공 전량 기부', 'ink'),
    'label-donate-elixir': ('영약 전량 기부', 'cream'), 'label-sect-board': ('문파 무공 보기', 'cream'),
    'label-shop-exchange': ('영약 1개 교환', 'ink'), 'label-gacha-once': ('1회 뽑기', 'ink'),
    'label-gacha-ten': ('10회 뽑기', 'ink'), 'label-gacha-again': ('다시 뽑기', 'ink'),
    'label-gacha-rates': ('확률 정보 보기', 'cream'), 'label-rebirth-view': ('환골탈태 보기', 'cream'),
    'label-rebirth-open': ('환골탈태 화면 열기', 'cream'), 'label-rebirth-proceed': ('환골탈태 진행', 'cream'),
    'label-rebirth-not-ready': ('조건 미충족', 'cream'), 'label-rebirth-execute': ('환골탈태 실행', 'cream'),
    'label-back-to-first-stage': ('1-1 전투로', 'ink'), 'label-backup-copy': ('백업 코드 복사', 'cream'),
    'label-backup-restore': ('백업 코드로 복원', 'cream'), 'label-backup-overwrite': ('현재 진행을 덮어쓰고 복원', 'cream'),
    'label-subtab-general': ('일반상점', 'cream'), 'label-subtab-gacha': ('기연(奇緣)', 'cream'),
    'title-offline-report': ('자리를 비운 동안', 'cream'), 'title-rebirth-ready': ('환골탈태 가능', 'cream'),
    'title-rebirth-confirm': ('환골탈태 확인', 'cream'), 'title-rebirth-done': ('환골탈태 완료', 'cream'),
    'title-gacha-rates': ('기연 확률', 'cream'), 'title-disassemble': ('장비 분해', 'cream'),
    'title-donate-chi': ('내공 전량 기부', 'cream'), 'title-donate-elixir': ('영약 전량 기부', 'cream'),
    'section-equipped': ('현재 장비', 'ink'), 'section-inventory': ('소지품', 'ink'),
    'section-candidates': ('소지품 후보', 'ink'), 'section-donate': ('기부', 'ink'),
    'section-stats': ('주요 능력치', 'ink'), 'section-rebirth': ('환골탈태', 'ink'),
    'section-kept': ('유지되는 항목', 'ink'), 'section-reset': ('초기화되는 항목', 'ink'),
    'section-gacha-result': ('뽑기 결과', 'ink'), 'section-save-backup': ('저장 백업', 'ink'),
}

def make_label(asset_id, text, palette):
    font_size = 60 if asset_id.startswith(('title-', 'section-')) else 48
    font = ImageFont.truetype(str(FONT), font_size)
    left, top, right, bottom = font.getbbox(text, stroke_width=3)
    width, height = right - left + 18, bottom - top + 18
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    fill, stroke = ((27, 20, 9, 255), (238, 202, 112, 255)) if palette == 'ink' else ((243, 230, 196, 255), (65, 39, 24, 255))
    draw.text((9 - left, 9 - top), text, font=font, fill=fill, stroke_width=3, stroke_fill=stroke)
    image.save(SRC / f'{asset_id}.png', 'PNG')
    image.save(OUT / f'{asset_id}.webp', 'WEBP', quality=92, method=6)
    print(asset_id, image.size)

OUT.mkdir(parents=True, exist_ok=True)
SRC.mkdir(parents=True, exist_ok=True)
for asset_id, (text, palette) in LABELS.items():
    make_label(asset_id, text, palette)
