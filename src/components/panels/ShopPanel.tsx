import { useState } from "react";
import { useGameStore, elixirExchangeCost } from "../../game/store";
import { GachaPanel } from "./GachaPanel";

// wiki "서브탭 구성: [일반상점] / [기연(奇緣)]" — 일반상점은 shopData.ts 주석대로
// 전(錢)→영약 교환 1종만 v1 구현.
function GeneralShopSection() {
  const gold = useGameStore((s) => s.gold);
  const elixirExchangeCount = useGameStore((s) => s.elixirExchangeCount);
  const exchangeGoldForElixir = useGameStore((s) => s.exchangeGoldForElixir);

  const cost = elixirExchangeCost(elixirExchangeCount);
  const disabled = gold < cost;

  return (
    <div id="general-shop-body">
      <div>
        보유 전(錢): {gold.toLocaleString()}
        <br />
        영약 교환소 — "쇠는 두드릴수록 강해지지만, 영약은 은자로 산다지." 노(老)씨가 웃으며 말했다.
      </div>
      <button className="gong-upgrade-btn" disabled={disabled} onClick={exchangeGoldForElixir}>
        영약 1개 교환 (전 {cost.toLocaleString()})
      </button>
    </div>
  );
}

interface Props {
  onClose: () => void;
}

type ShopTab = "general" | "gacha";

export function ShopPanel({ onClose }: Props) {
  const [tab, setTab] = useState<ShopTab>("general");

  return (
    <div id="shop-panel" className="stat-panel">
      <div className="panel-header">
        <span>상점</span>
        <button className="panel-close-btn" onClick={onClose}>닫기</button>
      </div>
      <div id="shop-tabs">
        <button className={"shop-tab" + (tab === "general" ? " shop-tab-active" : "")} onClick={() => setTab("general")}>
          일반상점
        </button>
        <button className={"shop-tab" + (tab === "gacha" ? " shop-tab-active" : "")} onClick={() => setTab("gacha")}>
          기연(奇緣)
        </button>
      </div>
      {tab === "general" ? <GeneralShopSection /> : <GachaPanel />}
    </div>
  );
}
