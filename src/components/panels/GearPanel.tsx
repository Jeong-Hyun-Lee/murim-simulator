import { useEffect, useRef, useState } from "react";
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

const BOTTOM_ROW: ReadonlySet<SlotId> = new Set(["foot", "ringL"]);

export function GearPanel({ onClose, onNavigate }: Props) {
  const equippedGear = useGameStore((s) => s.equippedGear);
  const inventory = useGameStore((s) => s.inventory);
  const gold = useGameStore((s) => s.gold);
  const enhanceStones = useGameStore((s) => s.enhanceStones);
  const protectionCharms = useGameStore((s) => s.protectionCharms);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const enhanceItem = useGameStore((s) => s.enhanceItem);
  const disassembleItems = useGameStore((s) => s.disassembleItems);

  const [openSlot, setOpenSlot] = useState<SlotId | null>(null);
  const [useProtection, setUseProtection] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openSlot) return;
    function handlePointerDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpenSlot(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenSlot(null);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openSlot]);

  const selectedItem = openSlot ? equippedGear[openSlot] : undefined;
  const targetLevel = selectedItem ? selectedItem.enhanceLevel + 1 : 0;
  const maxed = !!selectedItem && selectedItem.enhanceLevel >= ENHANCE_MAX_LEVEL;
  const cost = selectedItem ? enhanceCost(selectedItem.enhanceLevel) : 0;
  const stoneCost = selectedItem ? enhanceStoneCost(targetLevel) : 0;
  const protectEligible = !!selectedItem && needsProtectionEligible(targetLevel);
  const enhanceDisabled =
    !selectedItem || maxed || gold < cost || enhanceStones < stoneCost || (useProtection && protectionCharms < 1);
  const candidateItems = openSlot ? inventory.filter((it) => it.slot === openSlot) : [];
  const sortedInventory = [...inventory].sort((a, b) => gradeTier(b.grade) - gradeTier(a.grade));

  function toggleCheck(id: string) {
    setCheckedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSlot(slot: SlotId) {
    setUseProtection(false);
    setOpenSlot((cur) => (cur === slot ? null : slot));
  }

  return (
    <div id="gear-panel" className="stat-panel">
      <div className="panel-header">
        <span>장비</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>

      <div id="gear-doll">
        <div className="gear-doll-char" />
        {ALL_SLOTS.map((slot) => {
          const item = equippedGear[slot];
          const isOpen = openSlot === slot;
          return (
            <div key={slot} className="gear-doll-slot-wrap" style={{ gridArea: slot }}>
              <button
                className={"gear-doll-slot" + (isOpen ? " gear-doll-slot-active" : "")}
                style={item ? { borderColor: GRADE_COLOR[item.grade] } : undefined}
                onClick={() => toggleSlot(slot)}
              >
                <span>{SLOT_INFO[slot].name}</span>
                {item && <span className="gear-doll-slot-summary">{item.grade} +{item.enhanceLevel}</span>}
              </button>
              {isOpen && (
                <div ref={popoverRef} className={"gear-popover" + (BOTTOM_ROW.has(slot) ? " gear-popover-up" : "")}>
                  <div className="panel-subheader">{SLOT_INFO[slot].name}</div>
                  {selectedItem ? (
                    <>
                      <div style={{ color: GRADE_COLOR[selectedItem.grade] }}>
                        {selectedItem.grade} · 강화 +{selectedItem.enhanceLevel}/{ENHANCE_MAX_LEVEL}
                      </div>
                      {!maxed && (
                        <div>
                          강화 성공확률 {Math.round(enhanceSuccessChance(targetLevel) * 100)}% · 비용 전 {cost.toLocaleString()}
                          {stoneCost > 0 && ` + 강화석 ${stoneCost}`}
                        </div>
                      )}
                      {protectEligible && (
                        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input type="checkbox" checked={useProtection} onChange={(e) => setUseProtection(e.target.checked)} />
                          보호부적 사용(보유 {protectionCharms}) — 실패 시 단계 하락 방지
                        </label>
                      )}
                      <div className="equip-detail-actions">
                        <button className="gong-upgrade-btn" disabled={enhanceDisabled} onClick={() => enhanceItem(selectedItem.id, useProtection)}>
                          {maxed ? "대성" : "강화하기"}
                        </button>
                        <button className="panel-close-btn" onClick={() => unequipItem(slot)}>해제</button>
                        {!maxed && gold < cost && (
                          <button className="gong-upgrade-btn" onClick={() => onNavigate("stage")}>전 부족 · 사냥터로</button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="gong-board-locked-message">장착된 장비가 없습니다.</div>
                  )}
                  {candidateItems.length > 0 && (
                    <>
                      <div className="panel-subheader">인벤토리 후보</div>
                      <div className="gear-popover-candidates">
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
              )}
            </div>
          );
        })}
      </div>

      <div className="panel-subheader">전체 인벤토리 ({inventory.length}) · 강화석 {enhanceStones} · 보호부적 {protectionCharms}</div>
      <div id="gear-inventory-grid">
        {sortedInventory.map((item) => (
          <label key={item.id} className="gear-inventory-card" style={{ borderColor: GRADE_COLOR[item.grade] }}>
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
