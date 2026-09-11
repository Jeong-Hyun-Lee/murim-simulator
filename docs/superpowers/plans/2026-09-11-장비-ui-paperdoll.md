# 장비 UI 페이퍼돌 리디자인 + 장구→장비 명칭 통일 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게임 내 "장구" 명칭을 코드 식별자까지 포함해 "장비"로 전면 통일하고, 현재 좌측 슬롯목록+우측 상세 2단 컬럼인 장비창을 캐릭터 중심 페이퍼돌(중앙 목현 이미지 + 주변 9슬롯, 클릭 시 팝오버) 레이아웃으로 리디자인한다.

**Architecture:** 2단계로 나눈다 — (1) 순수 기계적 리네임(동작 변화 없음, 세이브키 v2로 초기화), (2) 리네임이 끝난 `GearPanel.tsx` 위에서 UI 구조만 바꾸는 리디자인. 두 단계를 분리해 각각 독립적으로 리뷰·검증 가능하게 한다.

**Tech Stack:** React 18 + TypeScript + Vite, Zustand(store.ts), PixiJS(캔버스, 이번 작업과 무관). 자동 테스트 프레임워크 없음(package.json에 test 스크립트 없음) — 이 프로젝트의 기존 검증 관행(`npx tsc --noEmit` + `npm run build` + claude-in-chrome 브라우저 실제 확인)을 그대로 따른다. "테스트 작성" 스텝은 이 관행으로 대체한다.

## Global Constraints

- 스펙 문서: `docs/superpowers/specs/2026-09-11-장비-ui-paperdoll-design.md` 전체가 이 계획의 근거.
- `equipItem`/`unequipItem`/`enhanceItem`/`disassembleItems` 액션 함수명은 동사라 리네임 대상 아님 — 그대로 유지.
- `wiki/concepts/장구-시스템.md` 등 위키 문서명·위키 파일을 가리키는 주석(예: `// wiki/concepts/장구-시스템.md ...`)은 이번 스펙 범위 밖 — 건드리지 않는다.
- `.equip-detail-actions` CSS 클래스는 `OnboardingFlow.tsx`/`SectPanel.tsx`에서도 쓰는 범용 "액션 버튼 줄" 유틸리티라 장비 도메인 전용이 아님 — 리네임하지 않고 `GearPanel.tsx`에서도 그대로 재사용한다.
- 커밋 메시지는 한글, Conventional Commits, 명사형 어미, `Co-Authored-By`/`Claude-Session` 트레일러 포함(이 세션의 기존 커밋 스타일 그대로).
- 각 태스크 종료 시 `npx tsc --noEmit`과 `npm run build`가 반드시 통과해야 한다(중간에 컴파일 깨진 상태로 커밋하지 않음).

---

### Task 1: 장구 → 장비 전면 리네임 (기계적, 동작 변화 없음)

**Files:**
- Modify: `src/game/state.ts`
- Rename+Modify: `src/game/equipData.ts` → `src/game/gearData.ts`
- Modify: `src/game/dropData.ts`
- Modify: `src/game/gachaData.ts`
- Modify: `src/game/gradeData.ts`
- Modify: `src/game/combat.ts`
- Modify: `src/game/store.ts`
- Modify: `src/components/panels/StatPanel.tsx`
- Modify: `src/components/TopBar.tsx`
- Modify: `src/components/panels/RebirthPanel.tsx`
- Modify: `src/App.tsx`
- Rename+Modify: `src/components/panels/EquipPanel.tsx` → `src/components/panels/GearPanel.tsx`

**Interfaces:**
- Produces (Task 2가 그대로 사용): `GearPanel` 컴포넌트(`Props { onClose: () => void; onNavigate: (key: PanelKey) => void }`), state 필드 `equippedGear: Partial<Record<SlotId, GearItem>>`, 타입 `GearItem`, 함수 `createGearItem(slot, grade, itemLevel): GearItem`, `aggregateGearStats(equipped): GearDerivedStats`, PanelKey 멤버 `"gear"`.

**리네임 매핑 표 (전 파일 공통):**

| 기존 | 신규 |
|---|---|
| 파일 `src/game/equipData.ts` | `src/game/gearData.ts` |
| 파일 `src/components/panels/EquipPanel.tsx` | `src/components/panels/GearPanel.tsx` |
| 타입 `EquipItem` | `GearItem` |
| 타입 `EquipDerivedStats` | `GearDerivedStats` |
| 함수 `createEquipItem` | `createGearItem` |
| 함수 `aggregateEquipStats` | `aggregateGearStats` |
| state 필드 `equippedItems` | `equippedGear` |
| `PanelKey`의 `"equip"` | `"gear"` |
| 컴포넌트 `EquipPanel` | `GearPanel` |
| import 경로 `"./equipData"` | `"./gearData"` |
| 화면 문구 "장구" | "장비" |

- [ ] **Step 1: `src/game/state.ts` 수정**

```ts
// 변경 전
import type { EquipItem, SlotId } from "./equipData";

const SAVE_KEY = "murim-simulator-save-v1";

export interface GameState {
  ...
  equippedItems: Partial<Record<SlotId, EquipItem>>;
  inventory: EquipItem[];
  ...
}

function defaultState(): GameState {
  return {
    ...
    equippedItems: {},
    ...
  };
}
```

```ts
// 변경 후
import type { GearItem, SlotId } from "./gearData";

const SAVE_KEY = "murim-simulator-save-v2";

export interface GameState {
  ...
  equippedGear: Partial<Record<SlotId, GearItem>>;
  inventory: GearItem[];
  ...
}

function defaultState(): GameState {
  return {
    ...
    equippedGear: {},
    ...
  };
}
```

(`...` 부분은 그대로 유지 — 위 4개 지점만 수정)

- [ ] **Step 2: `src/game/equipData.ts`를 `src/game/gearData.ts`로 이름 변경 후 내부 식별자 수정**

파일 내 다음 식별자를 전부 리네임 매핑 표대로 치환(파일 맨 위 주석 `// wiki/concepts/장구-시스템.md ...`는 위키 파일명 참조이므로 그대로 둠):

- `export interface EquipItem` → `export interface GearItem`
- `export function createEquipItem(...): EquipItem` → `export function createGearItem(...): GearItem`
- `export function itemBaseStats(item: EquipItem)` → `export function itemBaseStats(item: GearItem)`
- `export interface EquipDerivedStats` → `export interface GearDerivedStats`
- `export function aggregateEquipStats(equipped: Partial<Record<SlotId, EquipItem>>): EquipDerivedStats` → `export function aggregateGearStats(equipped: Partial<Record<SlotId, GearItem>>): GearDerivedStats`
- 함수 본문 내 `const stats: EquipDerivedStats = {` → `const stats: GearDerivedStats = {`

- [ ] **Step 3: `src/game/dropData.ts` 수정**

```ts
// 변경 전
import { ALL_SLOTS, createEquipItem, type EquipItem } from "./equipData";
...
export interface StageDropResult {
  items: EquipItem[];
  ...
}

export function rollStageDrops(...): { items: EquipItem[]; ... } {
  const items: EquipItem[] = [];
  ...
  items.push(createEquipItem(randomSlot(), "하품", playerLevel));
  ...
  items.push(createEquipItem(randomSlot(), "중품", playerLevel));
  ...
  if (Math.random() < RARE_BOSS_DROP_CHANCE) items.push(createEquipItem(randomSlot(), "상품", playerLevel));
  ...
  if (isFirstMajorClear) items.push(createEquipItem(randomSlot(), "절품", playerLevel));
```

```ts
// 변경 후
import { ALL_SLOTS, createGearItem, type GearItem } from "./gearData";
...
export interface StageDropResult {
  items: GearItem[];
  ...
}

export function rollStageDrops(...): { items: GearItem[]; ... } {
  const items: GearItem[] = [];
  ...
  items.push(createGearItem(randomSlot(), "하품", playerLevel));
  ...
  items.push(createGearItem(randomSlot(), "중품", playerLevel));
  ...
  if (Math.random() < RARE_BOSS_DROP_CHANCE) items.push(createGearItem(randomSlot(), "상품", playerLevel));
  ...
  if (isFirstMajorClear) items.push(createGearItem(randomSlot(), "절품", playerLevel));
```

(파일 맨 위 "장구-시스템.md" 주석 2곳은 위키 파일명 참조이므로 그대로 둠)

- [ ] **Step 4: `src/game/gachaData.ts` 수정**

```ts
// 변경 전
// 변경 — 여기서는 등급/슬롯만 정하고, 실제 EquipItem 생성(플레이어 레벨 필요)은 store.ts에서.
...
import { ALL_SLOTS, type SlotId } from "./equipData";
```

```ts
// 변경 후
// 변경 — 여기서는 등급/슬롯만 정하고, 실제 GearItem 생성(플레이어 레벨 필요)은 store.ts에서.
...
import { ALL_SLOTS, type SlotId } from "./gearData";
```

- [ ] **Step 5: `src/game/gradeData.ts` 수정**

```ts
// 변경 전
// gachaData.ts와 equipData.ts가 공유하므로 별도 모듈로 분리(기존엔 gachaData.ts에만 있었음).
```

```ts
// 변경 후
// gachaData.ts와 gearData.ts가 공유하므로 별도 모듈로 분리(기존엔 gachaData.ts에만 있었음).
```

- [ ] **Step 6: `src/game/combat.ts` 수정**

```ts
// 변경 전
// 자체는 equipData.ts에 그대로 보존 — 인벤토리/강화 UI 수치 표시는 원본을 그대로 보여준다).
```

```ts
// 변경 후
// 자체는 gearData.ts에 그대로 보존 — 인벤토리/강화 UI 수치 표시는 원본을 그대로 보여준다).
```

- [ ] **Step 7: `src/game/store.ts` 수정**

상단 import 블록 (`ALL_SLOTS, SLOT_INFO, ..., createEquipItem, aggregateEquipStats, ..., type EquipItem`을 가져오는 블록, `"./equipData"`에서 import):
- `createEquipItem` → `createGearItem`
- `aggregateEquipStats` → `aggregateGearStats`
- `type EquipItem` → `type GearItem`
- `"./equipData"` → `"./gearData"`

파일 전체에서 `equippedItems` 식별자(프로퍼티 접근 `s.equippedItems`, 구조분해/스프레드, 로컬 변수 선언, `Pick<...>` 타입 인자 문자열 `"equippedItems"`)를 전부 `equippedGear`로 치환. 구체적으로 다음 함수들 내부:
- `computePlayerStats`의 `Pick<GameStoreState, ... | "equippedItems" | ...>` → `"equippedGear"`로 변경
- `computePlayerStats`: `const agg = aggregateEquipStats(s.equippedItems);` → `const agg = aggregateGearStats(s.equippedGear);`
- `persist()`: `equippedItems: s.equippedItems,` → `equippedGear: s.equippedGear,`
- `type ItemLocation = { item: EquipItem; ... }` → `{ item: GearItem; ... }` (2곳: `equipped`/`inventory` 유니언)
- `findItemLocation()`: `s.equippedItems[slot]` → `s.equippedGear[slot]`
- `applyStageDrops()`: 반환 타입 `{ inventory: EquipItem[]; ... }` → `{ inventory: GearItem[]; ... }`
- `equipItem` 액션 본문: `s.equippedItems[item.slot]`, `const equippedItems = { ...s.equippedItems, [item.slot]: item }`, `computePlayerStats(s.level, { ...s, equippedItems })`, `equippedItems,`(반환 객체) → 전부 `equippedGear` 이름으로(로컬 변수명도 `equippedGear`로 통일)
- `unequipItem` 액션 본문: 동일 패턴(`s.equippedItems[slot]`, `const equippedItems = { ...s.equippedItems }`, `delete equippedItems[slot]`, `computePlayerStats(..., { ...s, equippedItems })`, `equippedItems,`) → `equippedGear`로
- `enhanceItem` 액션 본문: `const updatedItem: EquipItem = { ...item, enhanceLevel: result.newLevel };`, `const equippedItems = location.source === "equipped" ? { ...s.equippedItems, [item.slot]: updatedItem } : s.equippedItems;`, `computePlayerStats(..., { ...s, equippedItems })`, `equippedItems,` → `GearItem`/`equippedGear`로
- 가챠 관련 액션(`pullGachaSingle`/`pullGachaTen` 등): `createEquipItem(result.slot, result.grade, s.level)` → `createGearItem(...)`, `createEquipItem(r.slot, r.grade, s.level)` → `createGearItem(...)`
- `store.ts:254` 부근 드랍 요약 텍스트: `` `장구 ${drop.items.length}개` `` → `` `장비 ${drop.items.length}개` ``

파일 하단 재수출 블록:
```ts
// 변경 전
export {
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  itemBaseStats,
  aggregateEquipStats,
  enhanceCost,
  enhanceSuccessChance,
  enhanceStoneCost,
  needsProtectionEligible,
} from "./equipData";
...
export type { PullResult, StageId, GongBoard, GongCurrency, SlotId, EquipItem };
```

```ts
// 변경 후
export {
  ALL_SLOTS,
  SLOT_INFO,
  ENHANCE_MAX_LEVEL,
  itemBaseStats,
  aggregateGearStats,
  enhanceCost,
  enhanceSuccessChance,
  enhanceStoneCost,
  needsProtectionEligible,
} from "./gearData";
...
export type { PullResult, StageId, GongBoard, GongCurrency, SlotId, GearItem };
```

(`equipItem`/`unequipItem`/`enhanceItem`/`disassembleItems` 액션명, `GameStoreState` 인터페이스의 해당 메서드 시그니처는 그대로 둔다. 137~138번 줄 주석 "무공/장구강화/문파특전/환골탈태"는 위키 §7 공식 용어를 그대로 인용한 주석이라 범위 밖 — 손대지 않는다.)

- [ ] **Step 8: `src/components/panels/StatPanel.tsx` 수정**

```tsx
// 변경 전
import {
  useGameStore,
  totalGongBuffPercent,
  totalGongSecondaryStats,
  aggregateEquipStats,
  rebirthBuffPercent,
  sectBuffPercent,
} from "../../game/store";
import { combatPower } from "../../game/combat";

// 성장 요소(레벨/무공/장구/문파/환골탈태)를 한 화면에서 확인할 수 있는 종합 스탯창.
export function StatPanel({ onClose }: Props) {
  const player = useGameStore((s) => s.player);
  const playerHp = useGameStore((s) => s.playerHp);
  const level = useGameStore((s) => s.level);
  const gongLevels = useGameStore((s) => s.gongLevels);
  const equippedItems = useGameStore((s) => s.equippedItems);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const sectLevel = useGameStore((s) => s.sectLevel);

  const gongPower = totalGongBuffPercent(gongLevels);
  const gongSecondary = totalGongSecondaryStats(gongLevels);
  const equip = aggregateEquipStats(equippedItems);
```

```tsx
// 변경 후
import {
  useGameStore,
  totalGongBuffPercent,
  totalGongSecondaryStats,
  aggregateGearStats,
  rebirthBuffPercent,
  sectBuffPercent,
} from "../../game/store";
import { combatPower } from "../../game/combat";

// 성장 요소(레벨/무공/장비/문파/환골탈태)를 한 화면에서 확인할 수 있는 종합 스탯창.
export function StatPanel({ onClose }: Props) {
  const player = useGameStore((s) => s.player);
  const playerHp = useGameStore((s) => s.playerHp);
  const level = useGameStore((s) => s.level);
  const gongLevels = useGameStore((s) => s.gongLevels);
  const equippedGear = useGameStore((s) => s.equippedGear);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const sectLevel = useGameStore((s) => s.sectLevel);

  const gongPower = totalGongBuffPercent(gongLevels);
  const gongSecondary = totalGongSecondaryStats(gongLevels);
  const gear = aggregateGearStats(equippedGear);
```

나머지 렌더 부분에서 `equip.` 참조 전부 `gear.`로(변수명 변경에 따른 자연스러운 연쇄), 그리고:

```tsx
// 변경 전
          <div className="stat-row"><span>장구 강화 버프</span><span>+{pct(equip.enhanceBuffPercent)}</span></div>
          ...
          <div className="stat-row-sub"><span>· 장구 치명타확률/피해/공속/회피/내공획득</span><span>+{pct(equip.critChancePercent)} / +{pct(equip.critDamagePercent)} / +{pct(equip.attackSpeedPercent)} / +{pct(equip.evasionPercent)} / +{pct(equip.chiGainPercent)}</span></div>
```

```tsx
// 변경 후
          <div className="stat-row"><span>장비 강화 버프</span><span>+{pct(gear.enhanceBuffPercent)}</span></div>
          ...
          <div className="stat-row-sub"><span>· 장비 치명타확률/피해/공속/회피/내공획득</span><span>+{pct(gear.critChancePercent)} / +{pct(gear.critDamagePercent)} / +{pct(gear.attackSpeedPercent)} / +{pct(gear.evasionPercent)} / +{pct(gear.chiGainPercent)}</span></div>
```

- [ ] **Step 9: `src/components/TopBar.tsx` 수정**

```tsx
// 변경 전
  const hasAnyGear = useGameStore((s) => s.inventory.length > 0 || Object.keys(s.equippedItems).length > 0);
  ...
  const equipUnlocked = hasAnyGear;
  ...
      {equipUnlocked ? (
        <button className="topbar-btn" onClick={() => onTogglePanel("equip")}>장구</button>
      ) : (
        <button className="topbar-btn topbar-btn-locked" onClick={() => handleLockedClick("장구 아이템을 처음 획득하면 열립니다.")}>
          🔒 장구
```

```tsx
// 변경 후
  const hasAnyGear = useGameStore((s) => s.inventory.length > 0 || Object.keys(s.equippedGear).length > 0);
  ...
  const gearUnlocked = hasAnyGear;
  ...
      {gearUnlocked ? (
        <button className="topbar-btn" onClick={() => onTogglePanel("gear")}>장비</button>
      ) : (
        <button className="topbar-btn topbar-btn-locked" onClick={() => handleLockedClick("장비 아이템을 처음 획득하면 열립니다.")}>
          🔒 장비
```

(`equipUnlocked` 변수명도 `gearUnlocked`로 변경 — 아래 조건문 3곳 모두 함께 치환)

- [ ] **Step 10: `src/components/panels/RebirthPanel.tsx` 수정**

```tsx
// 변경 전
          유지됨: 전(錢), 장구 강화 단계, 누적 환골탈태 횟수
```

```tsx
// 변경 후
          유지됨: 전(錢), 장비 강화 단계, 누적 환골탈태 횟수
```

- [ ] **Step 11: `src/App.tsx` 수정**

```tsx
// 변경 전
import { EquipPanel } from "./components/panels/EquipPanel";
...
export type PanelKey = "gong" | "equip" | "rebirth" | "sect" | "shop" | "stage" | "stat";
...
      {openPanel === "equip" && <EquipPanel onClose={() => setOpenPanel(null)} onNavigate={setOpenPanel} />}
```

```tsx
// 변경 후
import { GearPanel } from "./components/panels/GearPanel";
...
export type PanelKey = "gong" | "gear" | "rebirth" | "sect" | "shop" | "stage" | "stat";
...
      {openPanel === "gear" && <GearPanel onClose={() => setOpenPanel(null)} onNavigate={setOpenPanel} />}
```

- [ ] **Step 12: `src/components/panels/EquipPanel.tsx`를 `src/components/panels/GearPanel.tsx`로 이름 변경, 내용 전체를 아래로 교체**

(이번 단계는 순수 리네임만 — 레이아웃은 Task 2에서 바꾼다. `unequipItem(selectedSlot)` 등 액션 호출은 그대로.)

```tsx
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

  const [selectedSlot, setSelectedSlot] = useState<SlotId>("weapon");
  const [useProtection, setUseProtection] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const selectedItem = equippedGear[selectedSlot];
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
    <div id="gear-panel" className="stat-panel">
      <div className="panel-header">
        <span>장비</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="equip-body">
        <div id="equip-slot-list">
          {ALL_SLOTS.map((slot) => {
            const item = equippedGear[slot];
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
            <div className="gong-board-locked-message">장착된 장비가 없습니다.</div>
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
```

(id/class 이름 `equip-*`는 Task 2에서 페이퍼돌로 갈아엎으면서 함께 정리한다 — 이번 Task 1에서는 건드리지 않아 diff를 작게 유지)

- [ ] **Step 13: 검증**

```bash
npx tsc --noEmit
npm run build
```

두 명령 모두 에러 없이 끝나야 함. `npx tsc --noEmit`이 `equipData`/`EquipItem`/`equippedItems` 잔존 참조를 잡아내면 위 스텝으로 돌아가 수정.

브라우저(claude-in-chrome)로 `npm run dev` 실행 후 확인:
- 상단바 "장구" 버튼이 "장비"로 보임
- 장비 패널 열어 기존과 동일하게 슬롯 목록/상세/강화/장착/해제/전 부족 CTA/하단 인벤토리 그리드·분해가 그대로 동작
- 개발자도구 Application 탭에서 localStorage 키가 `murim-simulator-save-v2`로 새로 생성됨(구 `-v1` 키가 남아있어도 무관)

- [ ] **Step 14: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: 장구→장비 명칭 전면 통일, 세이브 키 v2로 초기화

코드 식별자(EquipItem→GearItem, EquipPanel→GearPanel 등)와 화면 문구를
전부 장비로 통일. localStorage 필드명이 바뀌어 마이그레이션 없이
세이브 키를 v2로 올려 초기화(기존 플레이어 없어 허용).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YCebkvhMW8k6PcMQ5jD6BA
EOF
)"
```

---

### Task 2: GearPanel 페이퍼돌 레이아웃 + 팝오버

**Files:**
- Modify: `src/components/panels/GearPanel.tsx` (Task 1에서 만든 파일)
- Modify: `src/style.css`

**Interfaces:**
- Consumes: Task 1의 `GearPanel` Props(`onClose`, `onNavigate`), store의 `equippedGear`/`inventory`/`gold`/`enhanceStones`/`protectionCharms`/`equipItem`/`unequipItem`/`enhanceItem`/`disassembleItems`, `ALL_SLOTS`/`SLOT_INFO`/`GRADE_COLOR`/`gradeTier`/`ENHANCE_MAX_LEVEL`/`enhanceCost`/`enhanceSuccessChance`/`enhanceStoneCost`/`needsProtectionEligible`(모두 Task 1에서 이름 안 바뀐 기존 export).
- Produces: 없음(최종 UI, 이후 태스크 없음)

- [ ] **Step 1: `src/style.css`에서 죽는 규칙 삭제**

아래 규칙들을 삭제(전부 `#equip-body` 이하, Task 1의 `GearPanel.tsx`가 이번 스텝 이후로는 이 클래스들을 쓰지 않게 됨 — `.equip-detail-actions`는 `OnboardingFlow.tsx`/`SectPanel.tsx`가 계속 쓰므로 **삭제하지 않고 유지**):

```
#equip-body { ... }
#equip-slot-list { ... }
.equip-slot-btn { ... }
.equip-slot-btn-active { ... }
.equip-slot-summary { ... }
#equip-detail { ... }
.equip-enhance-info { ... }
.equip-protection-label { ... }
#equip-candidate-list { ... }
#equip-inventory-grid { ... }
.equip-inventory-card { ... }
```

- [ ] **Step 2: `src/style.css`에 페이퍼돌/팝오버 신규 규칙 추가**

`.equip-detail-actions` 규칙 바로 아래(또는 파일 끝 아무 곳)에 추가:

```css
#gear-doll {
  position: relative;
  display: grid;
  grid-template-columns: 72px 100px 72px;
  grid-template-rows: repeat(5, auto);
  grid-template-areas:
    ".     head   ."
    "neck  char   weapon"
    "arm   char   body"
    "waist char   ringR"
    "ringL foot   .";
  gap: 6px;
  justify-items: center;
  align-items: center;
  margin: 12px auto;
  max-width: 280px;
}

.gear-doll-char {
  grid-area: char;
  width: 96px;
  height: 96px;
  background-image: url("/sprites/character/mokhyeon-idle-sheet.png");
  background-position: 0 0;
  background-size: 576px 96px;
  image-rendering: pixelated;
}

.gear-doll-slot-wrap {
  position: relative;
}

.gear-doll-slot {
  pointer-events: auto;
  cursor: pointer;
  background: #201c14;
  color: #e8e0cf;
  border: 1px solid #5a4a2a;
  font-size: 10px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 56px;
}

.gear-doll-slot-active {
  background: #3a3020;
  border-color: #8a6a2c;
}

.gear-doll-slot-summary {
  color: #9a8f78;
  font-size: 10px;
}

.gear-popover {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
  z-index: 5;
  width: 220px;
  background: #16161e;
  border: 1px solid #8a6a2c;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}

.gear-popover-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 6px;
}

.gear-popover-candidates {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

#gear-inventory-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin: 8px 0;
  overflow-y: auto;
  flex: 1;
}

.gear-inventory-card {
  pointer-events: auto;
  cursor: pointer;
  border: 1px solid #5a4a2a;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px;
  font-size: 11px;
  line-height: 1.4;
}
```

(`.equip-enhance-info`/`.equip-protection-label`이 하던 역할은 아래 Step 3의 `GearPanel.tsx`가 그대로 재사용 — 팝오버 안에서 인라인으로 같은 스타일을 쓰므로 별도 클래스 불필요, `<div className="gear-popover">` 안에 있는 자식 요소는 기본 텍스트 스타일로 충분)

- [ ] **Step 3: `src/components/panels/GearPanel.tsx` 전체 교체**

```tsx
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
```

- [ ] **Step 4: 검증**

```bash
npx tsc --noEmit
npm run build
```

브라우저(claude-in-chrome)로 `npm run dev` 실행 후 확인:
- 장비 패널을 열면 중앙에 목현 캐릭터, 주위에 9개 슬롯 박스가 보임
- 슬롯 클릭 → 그 슬롯 위(또는 아래, 하단 줄 슬롯은 위로 뒤집힘)에 팝오버가 뜸
- 팝오버 바깥을 클릭하면 닫힘, Esc 키로도 닫힘
- 아무것도 장착 안 된 반지 슬롯에 인벤토리 아이템이 있으면 팝오버 안에 "장착" 버튼으로 나오고 클릭 시 실제 장착됨
- 장착된 슬롯 팝오버에서 강화하기/해제가 기존과 동일하게 동작, 전 부족 시 CTA로 사냥터 전환 확인
- 하단 전체 인벤토리 그리드 + 선택 분해가 기존과 동일하게 동작

- [ ] **Step 5: 커밋**

```bash
git add src/components/panels/GearPanel.tsx src/style.css
git commit -m "$(cat <<'EOF'
feat: 장비창 캐릭터 중심 페이퍼돌 레이아웃으로 리디자인

좌측 슬롯목록+우측 상세 2단 컬럼을 캐릭터 이미지 주위에 9슬롯을
해부학적으로 배치한 페이퍼돌로 교체. 슬롯 클릭 시 그 자리에 팝오버로
강화/장착/교체 UI를 모아 보여준다. 목현 idle 스프라이트 첫 프레임을
CSS 배경 위치로 잘라 캐릭터 이미지로 재사용(신규 에셋 없음).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YCebkvhMW8k6PcMQ5jD6BA
EOF
)"
```

---

### Task 3: 최종 회귀 확인 + 위키 반영 + 푸시

**Files:**
- Read-only 확인: `src/components/panels/SectPanel.tsx`, `src/components/OnboardingFlow.tsx`(스타일 회귀만 확인, 코드 변경 없음)
- Modify(선택): `wiki/concepts/장구-시스템.md`의 v1 구현 범위 절에 "장비" 리네임 + 페이퍼돌 UI 사실 추가, `wiki/log.md`

**Interfaces:** 없음(마무리 태스크).

- [ ] **Step 1: 다른 패널 회귀 확인 (브라우저)**

`.equip-detail-actions` 클래스를 공유하는 두 화면이 스타일 깨짐 없이 그대로인지 확인:
- 온보딩 흐름(`OnboardingFlow.tsx`) 진행 화면
- 문파 패널(`SectPanel.tsx`)

무공/장구 탭 순서, 전투력 표시, 사냥터 CTA 등 이번 세션 이전에 구현된 다른 기능이 함께 안 깨졌는지 짧게 훑어본다(전체 회귀 테스트는 아니고 육안 확인 수준).

- [ ] **Step 2: 위키 반영**

`wiki/concepts/장구-시스템.md`에 짧은 절 추가 (예: "## v2 구현 갱신 (2026-09-11)"):
- 게임 내 명칭이 "장비"로 통일됐고 코드 식별자도 함께 바뀌었다는 사실
- `EquipPanel` 2단 컬럼 UI가 캐릭터 중심 페이퍼돌(팝오버)로 교체됐다는 사실
- 위키 문서 파일명 자체는 유지(과거 소스 근거 파일명이므로)

`wiki/log.md` 맨 아래에 한 줄 추가:
```
## [2026-09-11] ingest | 장구→장비 명칭 전면 통일(코드 식별자 포함, 세이브 v2 초기화) + 장비창 캐릭터 중심 페이퍼돌 리디자인(슬롯 클릭 시 팝오버로 강화/장착 통합). 브레인스토밍(docs/superpowers/specs/2026-09-11-장비-ui-paperdoll-design.md) 거쳐 구현. 장구-시스템.md에 v2 구현 갱신 절 추가
```

- [ ] **Step 3: 최종 커밋 + 푸시**

```bash
git add wiki/concepts/장구-시스템.md wiki/log.md
git commit -m "$(cat <<'EOF'
docs: 장구-시스템 위키에 장비 리네임+페이퍼돌 UI 구현 반영

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YCebkvhMW8k6PcMQ5jD6BA
EOF
)"
git push
```
