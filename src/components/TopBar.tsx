import { useGameStore, isBossStage } from "../game/store";
import type { PanelKey } from "../App";
import { useSfxEnabled } from "../audio/sfx";

interface Props {
  onTogglePanel: (key: PanelKey) => void;
}

// wiki/concepts/ux-시나리오-기획서.md 6절 "온보딩 노출 순서" — 스테이지/무공은 항상 노출,
// 나머지 4개 탭은 진행도에 따라 순차 해금. 일일 퀘스트/문파채팅 NEW배지 등 부가 연출은 범위 밖.
export function TopBar({ onTogglePanel }: Props) {
  const stage = useGameStore((s) => s.stage);
  const gold = useGameStore((s) => s.gold);
  const chi = useGameStore((s) => s.chi);
  const elixir = useGameStore((s) => s.elixir);
  const paused = useGameStore((s) => s.paused);
  const togglePause = useGameStore((s) => s.togglePause);
  const bulkUpgradeAllGong = useGameStore((s) => s.bulkUpgradeAllGong);
  const showToast = useGameStore((s) => s.showToast);
  const hasAnyGear = useGameStore((s) => s.inventory.length > 0 || Object.keys(s.equippedGear).length > 0);
  const highestMajorCleared = useGameStore((s) => s.highestMajorCleared);
  const farmReturnStage = useGameStore((s) => s.farmReturnStage);
  const stopFarming = useGameStore((s) => s.stopFarming);
  const [sfxEnabled, toggleSfx] = useSfxEnabled();

  const gearUnlocked = hasAnyGear;
  const sectUnlocked = highestMajorCleared >= 2;
  const shopUnlocked = highestMajorCleared >= 1;
  const rebirthUnlocked = highestMajorCleared >= 7;

  function handleLockedClick(reason: string) {
    showToast(reason);
  }

  return (
    <div id="top-bar">
      <span>
        {stage.major}-{stage.sub}
        {isBossStage(stage) ? " (보스)" : ""}
        {farmReturnStage ? " (사냥중)" : ""}
      </span>
      <span>전 {gold.toLocaleString()}</span>
      <span>내공 {chi.toLocaleString()}</span>
      <span>영약 {elixir.toLocaleString()}</span>
      <button className="topbar-btn" onClick={() => onTogglePanel("stage")}>사냥터</button>
      <button className="topbar-btn" onClick={() => onTogglePanel("stat")}>스탯</button>
      {farmReturnStage && (
        <button className="topbar-btn" onClick={stopFarming}>
          자동 등반 복귀 ({farmReturnStage.major}-{farmReturnStage.sub})
        </button>
      )}
      <button className="topbar-btn" onClick={() => onTogglePanel("gong")}>무공</button>
      {gearUnlocked ? (
        <button className="topbar-btn" onClick={() => onTogglePanel("gear")}>장비</button>
      ) : (
        <button className="topbar-btn topbar-btn-locked" onClick={() => handleLockedClick("장비 아이템을 처음 획득하면 열립니다.")}>
          🔒 장비
        </button>
      )}
      {rebirthUnlocked ? (
        <button className="topbar-btn" onClick={() => onTogglePanel("rebirth")}>환골탈태</button>
      ) : (
        <button
          className="topbar-btn topbar-btn-locked"
          onClick={() => handleLockedClick("대7 보스 클리어 후 열립니다.")}
        >
          🔒 환골탈태
        </button>
      )}
      {sectUnlocked ? (
        <button className="topbar-btn" onClick={() => onTogglePanel("sect")}>문파</button>
      ) : (
        <button className="topbar-btn topbar-btn-locked" onClick={() => handleLockedClick("대2 클리어 후 열립니다.")}>
          🔒 문파
        </button>
      )}
      {shopUnlocked ? (
        <button className="topbar-btn" onClick={() => onTogglePanel("shop")}>상점</button>
      ) : (
        <button className="topbar-btn topbar-btn-locked" onClick={() => handleLockedClick("대1 보스 클리어 후 열립니다.")}>
          🔒 상점
        </button>
      )}
      <button className="topbar-btn" onClick={bulkUpgradeAllGong}>일괄 연마</button>
      <button className="topbar-btn" onClick={togglePause}>{paused ? "재개" : "일시정지"}</button>
      <button className="topbar-btn" onClick={toggleSfx}>{sfxEnabled ? "효과음 ON" : "효과음 OFF"}</button>
    </div>
  );
}
