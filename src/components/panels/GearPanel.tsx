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
  enhanceGoldRefund,
  GRADE_COLOR,
  gradeTier,
  type SlotId,
  type GearItem,
} from '../../game/store';
import type { StatKey } from '../../game/gearData';
import { playEnhanceSuccess, playEnhanceFail } from '../../audio/sfx';
import { Sheet } from '../Sheet';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';

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

// 매핑 없는 스탯(체력)은 아이콘 없이 텍스트만 유지.
const STAT_ICON: Partial<Record<StatKey, string>> = {
  atk: 'icon-stat-atk',
  def: 'icon-stat-def',
  critChance: 'icon-stat-crit-chance',
  critDamage: 'icon-stat-crit-damage',
  attackSpeed: 'icon-stat-attack-speed',
  evasion: 'icon-stat-evasion',
  chiGain: 'icon-stat-chi-gain',
  statusResist: 'icon-stat-status-resist',
};

const StatIcon = ({ statKey }: { statKey: StatKey }) => {
  const icon = STAT_ICON[statKey];
  if (!icon) return null;
  return (
    <img
      src={`/ui/icon/${icon}.webp`}
      alt=""
      style={{ width: 20, height: 20, verticalAlign: '-0.3em', marginRight: '0.25em' }}
    />
  );
};

const DiffIcon = ({ up }: { up: boolean }) => (
  <img
    src={`/ui/icon/icon-diff-${up ? 'up' : 'down'}.webp`}
    alt={up ? '▲' : '▼'}
    style={{ width: 16, height: 16, verticalAlign: '-0.2em' }}
  />
);

// 반지(L/R)는 아이콘을 공유한다.
const SLOT_ICON: Record<SlotId, string> = {
  weapon: 'weapon',
  body: 'body',
  head: 'head',
  arm: 'arm',
  foot: 'foot',
  waist: 'waist',
  neck: 'neck',
  ringL: 'ring',
  ringR: 'ring',
};

// 등급은 색에만 의존하지 않도록 항상 이름과 함께 표시.
const GradeChip = ({ item }: { item: GearItem }) => (
  <span
    className="grade-chip"
    data-grade={item.grade}
    style={{ borderColor: GRADE_COLOR[item.grade] }}
  >
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
          <StatIcon statKey={key} />
          {STAT_LABEL[key]} <DiffIcon up={delta > 0} /> {delta > 0 ? '+' : ''}
          {delta.toFixed(1)}
        </li>
      ))}
      {enhanceDelta !== 0 && (
        <li className={enhanceDelta > 0 ? 'up' : 'down'}>
          강화 <DiffIcon up={enhanceDelta > 0} /> {enhanceDelta > 0 ? '+' : ''}
          {enhanceDelta}단계
        </li>
      )}
      {diffs.length === 0 && enhanceDelta === 0 && <li>변화 없음</li>}
    </ul>
  );
};

const StatList = ({ item }: { item: GearItem }) => {
  const stats = itemBaseStats(item);
  const keys = Object.keys(stats) as StatKey[];
  return (
    <dl className="stat-list">
      {keys.map((key) => (
        <div className="stat-row" key={key}>
          <dt>
            <StatIcon statKey={key} />
            {STAT_LABEL[key]}
          </dt>
          <dd>{(stats[key] ?? 0).toFixed(1)}</dd>
        </div>
      ))}
    </dl>
  );
};

const EnhanceBlock = ({ item }: { item: GearItem }) => {
  const gold = useGameStore((s) => s.gold);
  const enhanceStones = useGameStore((s) => s.enhanceStones);
  const protectionCharms = useGameStore((s) => s.protectionCharms);
  const enhanceItem = useGameStore((s) => s.enhanceItem);
  const [useProtection, setUseProtection] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

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
  const hold = useHoldRepeat(enhance, disabled);

  if (item.enhanceLevel >= ENHANCE_MAX_LEVEL) {
    return <p className="muted">최대 강화(+{ENHANCE_MAX_LEVEL}) 달성</p>;
  }

  return (
    <div className="enhance-block">
      <div className="enhance-heading">
        <span>다음 강화</span>
        <strong>+{targetLevel}</strong>
      </div>
      <dl className="stat-list enhance-summary">
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
      <p className="enhance-risk">
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
        <button
          type="button"
          className="btn btn-primary hold-btn"
          disabled={disabled}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...hold}
        >
          +{targetLevel}{' '}
          <img src="/ui/label/label-enhance.webp" alt="강화하기" style={{ height: '1.1em' }} />
        </button>
      </div>
    </div>
  );
};

interface SlotSheetProps {
  slot: SlotId;
  onClose: () => void;
}

// 슬롯 비교 시트 — 현재 장비와 후보 장비를 위아래로 비교하고 목록에서 바로 장착.
const SlotSheet = ({ slot, onClose }: SlotSheetProps) => {
  const equipped = useGameStore((s) => s.equippedGear[slot]);
  const inventory = useGameStore((s) => s.inventory);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const candidates = inventory
    .filter((it) => it.slot === slot)
    .sort((a, b) => (isBetterGear(a, b) ? -1 : 1));

  return (
    <Sheet title={SLOT_INFO[slot].name} onClose={onClose}>
      <section className="sheet-section gear-current-section">
        <h3>
          <img
            src="/ui/label/section-equipped.webp"
            alt="현재 장비"
            style={{ height: '1.1em', display: 'block' }}
          />
        </h3>
        {equipped ? (
          <>
            <div className="item-line">
              <GradeChip item={equipped} />
              <button type="button" className="btn btn-ghost" onClick={() => unequipItem(slot)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <img
                    src="/ui/icon/icon-action-unequip.webp"
                    alt=""
                    aria-hidden="true"
                    style={{ width: 20, height: 20 }}
                  />
                  <img src="/ui/label/label-unequip.webp" alt="해제" style={{ height: '1.1em' }} />
                </span>
              </button>
            </div>
            <StatList item={equipped} />
            <EnhanceBlock key={equipped.id} item={equipped} />
          </>
        ) : (
          <p className="muted">장착한 장비가 없습니다.</p>
        )}
      </section>
      <section className="sheet-section">
        <h3>
          <img
            src="/ui/label/section-candidates.webp"
            alt="소지품 후보"
            style={{ height: '1.1em', verticalAlign: 'middle' }}
          />{' '}
          ({candidates.length})
        </h3>
        {candidates.length === 0 && (
          <p className="muted">이 슬롯에 착용할 수 있는 장비가 없습니다.</p>
        )}
        {candidates.map((item) => (
          <div key={item.id} className="card candidate-card">
            <div className="item-line">
              <GradeChip item={item} />
              <button type="button" className="btn btn-primary" onClick={() => equipItem(item.id)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <img
                    src="/ui/icon/icon-action-equip.webp"
                    alt=""
                    aria-hidden="true"
                    style={{ width: 20, height: 20 }}
                  />
                  <img src="/ui/label/label-equip.webp" alt="장착" style={{ height: '1.1em' }} />
                </span>
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

export const GearPanel = () => {
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
  const equippedCount = ALL_SLOTS.filter((slot) => equippedGear[slot] !== undefined).length;

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

  // 현재 필터로 보이는 소지품 전체를 선택하고, 이미 전부 선택돼 있으면 해제한다.
  const allShownChecked = shown.length > 0 && shown.every((it) => checkedIds.has(it.id));
  const toggleAllShown = () => {
    setCheckedIds((cur) => {
      const next = new Set(cur);
      shown.forEach((it) => (allShownChecked ? next.delete(it.id) : next.add(it.id)));
      return next;
    });
  };

  const exitDisassemble = () => {
    setDisassembleMode(false);
    setCheckedIds(new Set());
  };

  return (
    <div className="gear-tab">
      <section className="gear-overview" aria-label="장비 현황">
        <div>
          <span>장착 장비</span>
          <strong>
            {equippedCount}
            <small>/ {ALL_SLOTS.length}</small>
          </strong>
        </div>
        <div>
          <span>소지품</span>
          <strong>{inventory.length}</strong>
        </div>
        <p>장비 슬롯을 눌러 비교·장착·강화를 진행하세요.</p>
      </section>
      <div id="gear-doll">
        <p className="gear-doll-title">장착 장비</p>
        <div className="gear-doll-char" role="img" aria-label="주인공" />
        {ALL_SLOTS.map((slot) => {
          const item = equippedGear[slot];
          return (
            <button
              type="button"
              key={slot}
              className={`gear-doll-slot${item ? ' gear-doll-slot-equipped' : ''}${
                openSlot === slot ? ' gear-doll-slot-active' : ''
              }`}
              style={{ gridArea: slot, borderColor: item ? GRADE_COLOR[item.grade] : undefined }}
              onClick={() => setOpenSlot(slot)}
            >
              <img
                src={`/ui/icon/icon-slot-${SLOT_ICON[slot]}.webp`}
                alt=""
                className="gear-doll-slot-icon"
              />
              <span>{SLOT_INFO[slot].name.split('(')[0]}</span>
              <small>{item ? `${item.grade} +${item.enhanceLevel}` : '비어 있음'}</small>
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        <label htmlFor="gear-slot-filter">
          <span className="sr-only">슬롯 필터</span>
          <img src="/ui/icon/icon-filter.webp" alt="" className="toolbar-icon" />
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
          <img src="/ui/icon/icon-sort.webp" alt="" className="toolbar-icon" />
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

      <h3 className="section-title">
        <img
          src="/ui/label/section-inventory.webp"
          alt="소지품"
          style={{ height: '1.1em', verticalAlign: 'middle' }}
        />{' '}
        ({inventory.length})
      </h3>
      {shown.length === 0 && (
        <div className="gear-empty-state">
          <strong>
            {inventory.length === 0 ? '아직 획득한 장비가 없습니다' : '이 슬롯에는 장비가 없습니다'}
          </strong>
          <span>
            {inventory.length === 0
              ? '전투에서 적을 처치하면 장비를 획득합니다.'
              : '다른 장비 슬롯을 선택하거나 전체 목록을 확인하세요.'}
          </span>
        </div>
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
                className="btn"
                disabled={shown.length === 0}
                onClick={toggleAllShown}
              >
                <img
                  src={
                    allShownChecked
                      ? '/ui/label/label-deselect-all.webp'
                      : '/ui/label/label-select-all.webp'
                  }
                  alt={allShownChecked ? '전체 해제' : '전체 선택'}
                  style={{ height: '1.1em', display: 'block' }}
                />
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={checkedItems.length === 0}
                onClick={() => setConfirmDisassemble(true)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <img
                    src="/ui/icon/icon-action-disassemble.webp"
                    alt=""
                    aria-hidden="true"
                    style={{ width: 20, height: 20 }}
                  />
                  <img
                    src="/ui/label/label-disassemble.webp"
                    alt="분해하기"
                    style={{ height: '1.1em' }}
                  />
                </span>
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <img
                    src="/ui/icon/icon-action-equip.webp"
                    alt=""
                    aria-hidden="true"
                    style={{ width: 20, height: 20 }}
                  />
                  <img
                    src="/ui/label/label-equip-best.webp"
                    alt="최적 장착"
                    style={{ height: '1.1em' }}
                  />
                </span>
              </button>
              <button
                type="button"
                className="btn"
                disabled={inventory.length === 0}
                onClick={() => setDisassembleMode(true)}
              >
                <img
                  src="/ui/label/label-disassemble-select.webp"
                  alt="분해 선택"
                  style={{ height: '1.1em', display: 'block' }}
                />
              </button>
            </div>
          </>
        )}
      </div>

      {openSlot && <SlotSheet slot={openSlot} onClose={() => setOpenSlot(null)} />}
      {confirmDisassemble && (
        <Sheet
          title="장비 분해"
          titleImage="/ui/label/title-disassemble.webp"
          onClose={() => setConfirmDisassemble(false)}
        >
          <section className="disassemble-confirm-card">
            <p>되돌릴 수 없는 선택</p>
            <h3>선택 장비 {checkedItems.length}개</h3>
            <dl>
              <div>
                <dt>획득 강화석</dt>
                <dd>+{disassembleStoneYield(checkedItems)}</dd>
              </div>
              {enhanceGoldRefund(checkedItems) > 0 && (
                <div>
                  <dt>강화 환급 전</dt>
                  <dd>+{enhanceGoldRefund(checkedItems).toLocaleString()}</dd>
                </div>
              )}
            </dl>
            <span>분해한 장비는 되돌릴 수 없습니다.</span>
          </section>
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
