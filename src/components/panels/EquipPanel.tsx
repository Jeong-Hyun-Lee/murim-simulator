import { useState } from "react";
import {
  useGameStore,
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  enhanceCost,
  enhanceSuccessChance,
  enhanceStoneCost,
  needsProtectionEligible,
  GRADE_COLOR,
  gradeTier,
  type SlotId,
} from "../../game/store";
import type { PanelKey } from "../../App";

interface Props {
  onClose: () => void;
  onNavigate: (key: PanelKey) => void;
}

export function EquipPanel({ onClose, onNavigate }: Props) {
  const equippedItems = useGameStore((s) => s.equippedItems);
  const inventory = useGameStore((s) => s.inventory);
  const gold = useGameStore((s) => s.gold);
  const enhanceStones = useGameStore((s) => s.enhanceStones);
  const protectionCharms = useGameStore((s) => s.protectionCharms);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const enhanceItem = useGameStore((s) => s.enhanceItem);
  const disassembleItems = useGameStore((s) => s.disassembleItems);

  const [selectedSlot, setSelectedSlot] = useState<SlotId>("weapon");
  const [useProtection, setUseProtection] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const selectedItem = equippedItems[selectedSlot];
  const targetLevel = selectedItem ? selectedItem.enhanceLevel + 1 : 0;
  const maxed = !!selectedItem && selectedItem.enhanceLevel >= ENHANCE_MAX_LEVEL;
  const cost = selectedItem ? enhanceCost(selectedItem.enhanceLevel) : 0;
  const stoneCost = selectedItem ? enhanceStoneCost(targetLevel) : 0;
  const protectEligible = !!selectedItem && needsProtectionEligible(targetLevel);
  const enhanceDisabled =
    !selectedItem || maxed || gold < cost || enhanceStones < stoneCost || (useProtection && protectionCharms < 1);

  const candidateItems = inventory.filter((it) => it.slot === selectedSlot);
  const sortedInventory = [...inventory].sort((a, b) => gradeTier(b.grade) - gradeTier(a.grade));

  function toggleCheck(id: string) {
    setCheckedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div id="equip-panel" className="stat-panel">
      <div className="panel-header">
        <span>장구</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="equip-body">
        <div id="equip-slot-list">
          {ALL_SLOTS.map((slot) => {
            const item = equippedItems[slot];
            return (
              <button
                key={slot}
                className={"equip-slot-btn" + (slot === selectedSlot ? " equip-slot-btn-active" : "")}
                onClick={() => setSelectedSlot(slot)}
                style={item ? { borderColor: GRADE_COLOR[item.grade] } : undefined}
              >
                <span className="equip-slot-name">{SLOT_INFO[slot].name}</span>
                <span className="equip-slot-summary">{item ? `${item.grade} +${item.enhanceLevel}` : "비어있음"}</span>
              </button>
            );
          })}
        </div>
        <div id="equip-detail">
          <div className="panel-subheader">{SLOT_INFO[selectedSlot].name}</div>
          {selectedItem ? (
            <>
              <div style={{ color: GRADE_COLOR[selectedItem.grade] }}>
                {selectedItem.grade} · 강화 +{selectedItem.enhanceLevel}/{ENHANCE_MAX_LEVEL}
              </div>
              {!maxed && (
                <div className="equip-enhance-info">
                  강화 성공확률 {Math.round(enhanceSuccessChance(targetLevel) * 100)}% · 비용 전 {cost.toLocaleString()}
                  {stoneCost > 0 && ` + 강화석 ${stoneCost}`}
                </div>
              )}
              {protectEligible && (
                <label className="equip-protection-label">
                  <input type="checkbox" checked={useProtection} onChange={(e) => setUseProtection(e.target.checked)} />
                  보호부적 사용(보유 {protectionCharms}) — 실패 시 단계 하락 방지
                </label>
              )}
              <div className="equip-detail-actions">
                <button className="gong-upgrade-btn" disabled={enhanceDisabled} onClick={() => enhanceItem(selectedItem.id, useProtection)}>
                  {maxed ? "대성" : "강화하기"}
                </button>
                <button className="panel-close-btn" onClick={() => unequipItem(selectedSlot)}>해제</button>
                {!maxed && gold < cost && (
                  <button className="gong-upgrade-btn" onClick={() => onNavigate("stage")}>전 부족 · 사냥터로</button>
                )}
              </div>
            </>
          ) : (
            <div className="gong-board-locked-message">장착된 장구가 없습니다.</div>
          )}
          {candidateItems.length > 0 && (
            <>
              <div className="panel-subheader">인벤토리 — {SLOT_INFO[selectedSlot].name}</div>
              <div id="equip-candidate-list">
                {candidateItems.map((item) => (
                  <div key={item.id} className="gong-node">
                    <span className="gong-node-name" style={{ color: GRADE_COLOR[item.grade] }}>
                      {item.grade} +{item.enhanceLevel}
                    </span>
                    <button className="gong-upgrade-btn" onClick={() => equipItem(item.id)}>장착</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="panel-subheader">전체 인벤토리 ({inventory.length}) · 강화석 {enhanceStones} · 보호부적 {protectionCharms}</div>
      <div id="equip-inventory-grid">
        {sortedInventory.map((item) => (
          <label key={item.id} className="equip-inventory-card" style={{ borderColor: GRADE_COLOR[item.grade] }}>
            <input type="checkbox" checked={checkedIds.has(item.id)} onChange={() => toggleCheck(item.id)} />
            {SLOT_INFO[item.slot].name}
            <br />
            {item.grade} +{item.enhanceLevel}
          </label>
        ))}
      </div>
      <button
        className="gong-upgrade-btn"
        disabled={checkedIds.size === 0}
        onClick={() => {
          disassembleItems([...checkedIds]);
          setCheckedIds(new Set());
        }}
      >
        선택 분해 ({checkedIds.size})
      </button>
    </div>
  );
}
