import { useState } from 'react';
import {
  useGameStore,
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  DOWNGRADE_CHANCE_ON_FAIL,
  enhanceCost,
  enhanceSuccessChance,
  enhanceStoneCost,
  needsProtectionEligible,
  itemBaseStats,
  isBetterGear,
  disassembleStoneYield,
  GRADE_COLOR,
  gradeTier,
  type SlotId,
  type GearItem,
} from '../../game/store';
import type { StatKey } from '../../game/gearData';
import { playEnhanceSuccess, playEnhanceFail } from '../../audio/sfx';
import { Sheet } from '../Sheet';
import type { NavTarget } from '../common';

const STAT_LABEL: Record<StatKey, string> = {
  atk: '공격',
  def: '방어',
  hp: '체력',
  critChance: '치명타 확률',
  critDamage: '치명타 피해',
  attackSpeed: '공격속도',
  evasion: '회피',
  chiGain: '내공 획득',
  statusResist: '상태이상 저항',
};

// 등급은 색에만 의존하지 않도록 항상 이름과 함께 표시.
const GradeChip = ({ item }: { item: GearItem }) => (
  <span className="grade-chip" style={{ borderColor: GRADE_COLOR[item.grade] }}>
    <span className="grade-dot" style={{ background: GRADE_COLOR[item.grade] }} />
    {item.grade} +{item.enhanceLevel}
  </span>
);

const StatDiff = ({ from, to }: { from: GearItem | undefined; to: GearItem }) => {
  const a = from ? itemBaseStats(from) : {};
  const b = itemBaseStats(to);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])] as StatKey[];
  const diffs = keys
    .map((key) => ({ key, delta: (b[key] ?? 0) - (a[key] ?? 0) }))
    .filter((d) => Math.abs(d.delta) >= 0.05);
  const enhanceDelta = to.enhanceLevel - (from?.enhanceLevel ?? 0);
  return (
    <ul className="stat-diff">
      {diffs.map(({ key, delta }) => (
        <li key={key} className={delta > 0 ? 'up' : 'down'}>
          {STAT_LABEL[key]} {delta > 0 ? '▲ +' : '▼ '}
          {delta.toFixed(1)}
        </li>
      ))}
      {enhanceDelta !== 0 && (
        <li className={enhanceDelta > 0 ? 'up' : 'down'}>
          강화 {enhanceDelta > 0 ? '▲ +' : '▼ '}
          {enhanceDelta}단계
        </li>
      )}
      {diffs.length === 0 && enhanceDelta === 0 && <li>변화 없음</li>}
    </ul>
  );
};

const EnhanceBlock = ({ item, onNavigate }: { item: GearItem; onNavigate: () => void }) => {
  const gold = useGameStore((s) => s.gold);
  const enhanceStones = useGameStore((s) => s.enhanceStones);
  const protectionCharms = useGameStore((s) => s.protectionCharms);
  const enhanceItem = useGameStore((s) => s.enhanceItem);
  const [useProtection, setUseProtection] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  if (item.enhanceLevel >= ENHANCE_MAX_LEVEL) {
    return <p className="muted">최대 강화(+{ENHANCE_MAX_LEVEL}) 달성</p>;
  }

  const targetLevel = item.enhanceLevel + 1;
  const cost = enhanceCost(item.enhanceLevel);
  const stoneCost = enhanceStoneCost(targetLevel);
  const protectEligible = needsProtectionEligible(targetLevel);
  const protecting = protectEligible && useProtection;
  let failText = '실패 시 현재 단계 유지';
  if (protectEligible && !protecting) {
    failText = `실패 시 ${Math.round(DOWNGRADE_CHANCE_ON_FAIL * 100)}% 확률로 1단계 하락`;
  }
  const disabled = gold < cost || enhanceStones < stoneCost || (protecting && protectionCharms < 1);

  const enhance = () => {
    const before = item.enhanceLevel;
    const result = enhanceItem(item.id, protecting);
    if (!result) return;
    if (result.success) {
      playEnhanceSuccess();
      setLastResult(`✔ 성공: +${before} → +${before + 1}`);
    } else {
      playEnhanceFail();
      setLastResult(`✖ 실패: +${before}에서 강화되지 않았습니다`);
    }
  };

  return (
    <div className="enhance-block">
      <dl className="stat-list">
        <div className="stat-row">
          <dt>성공 확률</dt>
          <dd>{Math.round(enhanceSuccessChance(targetLevel) * 100)}%</dd>
        </div>
        <div className="stat-row">
          <dt>비용</dt>
          <dd>
            전 {cost.toLocaleString()}
            {stoneCost > 0 && ` · 강화석 ${stoneCost}`}
          </dd>
        </div>
      </dl>
      <p className="muted">
        {failText} · 보유 전 {gold.toLocaleString()} · 강화석 {enhanceStones}
      </p>
      {protectEligible && (
        <label className="check-row" htmlFor={`protect-${item.id}`}>
          <input
            id={`protect-${item.id}`}
            type="checkbox"
            checked={useProtection}
            onChange={(e) => setUseProtection(e.target.checked)}
          />
          보호부적 사용 (보유 {protectionCharms}) — 실패해도 단계 하락 없음
        </label>
      )}
      {lastResult && (
        <p className="result-line" role="status">
          {lastResult}
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={enhance}>
          +{targetLevel} 강화하기
        </button>
        {gold < cost && (
          <button type="button" className="btn" onClick={onNavigate}>
            전 부족 · 사냥터 보기
          </button>
        )}
      </div>
    </div>
  );
};

interface SlotSheetProps {
  slot: SlotId;
  onClose: () => void;
  onNavigate: (target: NavTarget) => void;
}

// 슬롯 비교 시트 — 현재 장비와 후보 장비를 위아래로 비교하고 목록에서 바로 장착.
const SlotSheet = ({ slot, onClose, onNavigate }: SlotSheetProps) => {
  const equipped = useGameStore((s) => s.equippedGear[slot]);
  const inventory = useGameStore((s) => s.inventory);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const candidates = inventory
    .filter((it) => it.slot === slot)
    .sort((a, b) => (isBetterGear(a, b) ? -1 : 1));
  const goFarm = () => {
    onClose();
    onNavigate('stagePicker');
  };

  return (
    <Sheet title={SLOT_INFO[slot].name} onClose={onClose}>
      <section className="sheet-section">
        <h3>현재 장비</h3>
        {equipped ? (
          <>
            <div className="item-line">
              <GradeChip item={equipped} />
              <button type="button" className="btn btn-ghost" onClick={() => unequipItem(slot)}>
                해제
              </button>
            </div>
            <EnhanceBlock key={equipped.id} item={equipped} onNavigate={goFarm} />
          </>
        ) : (
          <p className="muted">장착한 장비가 없습니다.</p>
        )}
      </section>
      <section className="sheet-section">
        <h3>소지품 후보 ({candidates.length})</h3>
        {candidates.length === 0 && (
          <p className="muted">이 슬롯에 착용할 수 있는 장비가 없습니다.</p>
        )}
        {candidates.map((item) => (
          <div key={item.id} className="card candidate-card">
            <div className="item-line">
              <GradeChip item={item} />
              <button type="button" className="btn btn-primary" onClick={() => equipItem(item.id)}>
                장착
              </button>
            </div>
            <StatDiff from={equipped} to={item} />
          </div>
        ))}
      </section>
    </Sheet>
  );
};

type SortKey = 'grade' | 'enhance';

export const GearPanel = ({ onNavigate }: { onNavigate: (target: NavTarget) => void }) => {
  const equippedGear = useGameStore((s) => s.equippedGear);
  const inventory = useGameStore((s) => s.inventory);
  const equipBestAll = useGameStore((s) => s.equipBestAll);
  const disassembleItems = useGameStore((s) => s.disassembleItems);

  const [openSlot, setOpenSlot] = useState<SlotId | null>(null);
  const [slotFilter, setSlotFilter] = useState<SlotId | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('grade');
  const [disassembleMode, setDisassembleMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [confirmDisassemble, setConfirmDisassemble] = useState(false);

  const shown = inventory
    .filter((it) => slotFilter === 'all' || it.slot === slotFilter)
    .sort((a, b) =>
      sortKey === 'grade'
        ? gradeTier(b.grade) - gradeTier(a.grade) || b.enhanceLevel - a.enhanceLevel
        : b.enhanceLevel - a.enhanceLevel || gradeTier(b.grade) - gradeTier(a.grade),
    );
  // 장착 중 장비는 inventory에 없으므로 분해 대상에 포함될 수 없다.
  const checkedItems = inventory.filter((it) => checkedIds.has(it.id));

  const toggleCheck = (id: string) => {
    setCheckedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitDisassemble = () => {
    setDisassembleMode(false);
    setCheckedIds(new Set());
  };

  return (
    <div className="gear-tab">
      <div id="gear-doll">
        <div className="gear-doll-char" role="img" aria-label="주인공" />
        {ALL_SLOTS.map((slot) => {
          const item = equippedGear[slot];
          return (
            <button
              type="button"
              key={slot}
              className={`gear-doll-slot${openSlot === slot ? ' gear-doll-slot-active' : ''}`}
              style={{ gridArea: slot, borderColor: item ? GRADE_COLOR[item.grade] : undefined }}
              onClick={() => setOpenSlot(slot)}
            >
              <span>{SLOT_INFO[slot].name.split('(')[0]}</span>
              <small>{item ? `${item.grade} +${item.enhanceLevel}` : '비어 있음'}</small>
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        <label htmlFor="gear-slot-filter">
          <span className="sr-only">슬롯 필터</span>
          <select
            id="gear-slot-filter"
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value as SlotId | 'all')}
          >
            <option value="all">전체 슬롯</option>
            {ALL_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {SLOT_INFO[slot].name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="gear-sort">
          <span className="sr-only">정렬</span>
          <select
            id="gear-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="grade">등급순</option>
            <option value="enhance">강화 단계순</option>
          </select>
        </label>
      </div>

      <h3 className="section-title">소지품 ({inventory.length})</h3>
      {shown.length === 0 && (
        <p className="muted empty">
          {inventory.length === 0
            ? '소지품이 비어 있습니다. 전투에서 적을 처치하면 장비를 얻습니다.'
            : '이 슬롯의 소지품이 없습니다.'}
        </p>
      )}
      <div className="inventory-grid">
        {shown.map((item) =>
          disassembleMode ? (
            <label
              key={item.id}
              htmlFor={`gear-item-${item.id}`}
              className={`card inventory-card${checkedIds.has(item.id) ? ' inventory-card-checked' : ''}`}
            >
              <input
                id={`gear-item-${item.id}`}
                type="checkbox"
                checked={checkedIds.has(item.id)}
                onChange={() => toggleCheck(item.id)}
              />
              <span>{SLOT_INFO[item.slot].name}</span>
              <GradeChip item={item} />
            </label>
          ) : (
            <button
              type="button"
              key={item.id}
              className="card inventory-card"
              onClick={() => setOpenSlot(item.slot)}
            >
              <span>{SLOT_INFO[item.slot].name}</span>
              <GradeChip item={item} />
            </button>
          ),
        )}
      </div>

      <div className="sticky-actions">
        {disassembleMode ? (
          <>
            <p>
              {checkedItems.length}개 선택 · 강화석 +{disassembleStoneYield(checkedItems)}
            </p>
            <div className="btn-row">
              <button type="button" className="btn" onClick={exitDisassemble}>
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={checkedItems.length === 0}
                onClick={() => setConfirmDisassemble(true)}
              >
                분해하기
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">
              최적 장착: 등급 우선, 같으면 강화 단계순 (보조 능력치는 비교 안 함)
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={equipBestAll}>
                최적 장착
              </button>
              <button
                type="button"
                className="btn"
                disabled={inventory.length === 0}
                onClick={() => setDisassembleMode(true)}
              >
                분해 선택
              </button>
            </div>
          </>
        )}
      </div>

      {openSlot && (
        <SlotSheet slot={openSlot} onClose={() => setOpenSlot(null)} onNavigate={onNavigate} />
      )}
      {confirmDisassemble && (
        <Sheet title="장비 분해" onClose={() => setConfirmDisassemble(false)}>
          <p>
            선택한 장비 <strong>{checkedItems.length}개</strong>를 분해해 강화석{' '}
            <strong>{disassembleStoneYield(checkedItems)}개</strong>를 얻습니다. 분해한 장비는
            되돌릴 수 없습니다.
          </p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => setConfirmDisassemble(false)}>
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                disassembleItems(checkedItems.map((it) => it.id));
                setConfirmDisassemble(false);
                exitDisassemble();
              }}
            >
              분해 실행
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
};
