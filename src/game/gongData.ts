// wiki/concepts/무공-시스템.md "수치" 절 그대로 구현 — 챕터1 5개 보드 전부.
// 보드 2~5(회선장법/유운경신술/태을혼원공/폭뢰도법)의 개별 초식명은 위키에 정의돼 있지 않아
// 2026-09-10 신규 명명(장법/경신술/심법/도법 각 계열 테마에 맞춰 작명), 위키에도 동일 반영.

export type NodeTier = "primary" | "secondary" | "capstone";

export interface GongNode {
  id: string;
  name: string;
  tier: NodeTier;
  maxLevel: number;
  baseCost: number;
  growthRate: number;
  effectPerLevel: number; // 레벨당 전투력 버프 %
  requires?: { nodeId: string; level: number }[];
}

export interface GongBoard {
  id: string;
  name: string;
  unlockMajor: number; // highestMajorCleared >= 이 값이어야 보드 자체가 잠금 해제 (0 = 시작부터 개방)
  nodes: GongNode[];
}

const PRIMARY_COST = { baseCost: 30, growthRate: 1.12, effectPerLevel: 0.06, maxLevel: 50 } as const;
const SECONDARY_COST = { baseCost: 200, growthRate: 1.15, effectPerLevel: 0.12, maxLevel: 50 } as const;
const CAPSTONE_COST = { baseCost: 2000, growthRate: 1.25, effectPerLevel: 0.4, maxLevel: 20 } as const;

export const GONG_BOARDS: GongBoard[] = [
  {
    id: "samjae1",
    name: "삼재검법 1보",
    unlockMajor: 0,
    nodes: [
      { id: "cheon", name: "제1식 천(天)", tier: "primary", ...PRIMARY_COST },
      { id: "ji", name: "제2식 지(地)", tier: "primary", ...PRIMARY_COST },
      { id: "in", name: "제3식 인(人)", tier: "primary", ...PRIMARY_COST },
      {
        id: "habil",
        name: "합일보",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "cheon", level: 10 },
          { nodeId: "ji", level: 10 },
          { nodeId: "in", level: 10 },
        ],
      },
      {
        id: "sangsaeng",
        name: "삼재상생",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "cheon", level: 10 },
          { nodeId: "ji", level: 10 },
          { nodeId: "in", level: 10 },
        ],
      },
      {
        id: "capstone",
        name: "삼재합일",
        tier: "capstone",
        ...CAPSTONE_COST,
        requires: [
          { nodeId: "habil", level: 30 },
          { nodeId: "sangsaeng", level: 30 },
        ],
      },
    ],
  },
  {
    id: "hoeseon",
    name: "회선장법",
    unlockMajor: 3,
    nodes: [
      { id: "hoeseon_seonpung", name: "선풍장(旋風掌)", tier: "primary", ...PRIMARY_COST },
      { id: "hoeseon_bungsan", name: "붕산장(崩山掌)", tier: "primary", ...PRIMARY_COST },
      { id: "hoeseon_bokho", name: "복호장(伏虎掌)", tier: "primary", ...PRIMARY_COST },
      {
        id: "hoeseon_yeonhwan",
        name: "연환삼장(連環三掌)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "hoeseon_seonpung", level: 10 },
          { nodeId: "hoeseon_bungsan", level: 10 },
          { nodeId: "hoeseon_bokho", level: 10 },
        ],
      },
      {
        id: "hoeseon_gwangpung",
        name: "광풍벽력장(狂風霹靂掌)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "hoeseon_seonpung", level: 10 },
          { nodeId: "hoeseon_bungsan", level: 10 },
          { nodeId: "hoeseon_bokho", level: 10 },
        ],
      },
      {
        id: "hoeseon_capstone",
        name: "회선붕천장(回旋崩天掌)",
        tier: "capstone",
        ...CAPSTONE_COST,
        requires: [
          { nodeId: "hoeseon_yeonhwan", level: 30 },
          { nodeId: "hoeseon_gwangpung", level: 30 },
        ],
      },
    ],
  },
  {
    id: "yuun",
    name: "유운경신술",
    unlockMajor: 5,
    nodes: [
      { id: "yuun_dabun", name: "답운보(踏雲步)", tier: "primary", ...PRIMARY_COST },
      { id: "yuun_yeonja", name: "연자보(燕子步)", tier: "primary", ...PRIMARY_COST },
      { id: "yuun_pyoholl", name: "표홀신법(飄忽身法)", tier: "primary", ...PRIMARY_COST },
      {
        id: "yuun_sinhaeng",
        name: "유운신행(流雲身行)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "yuun_dabun", level: 10 },
          { nodeId: "yuun_yeonja", level: 10 },
          { nodeId: "yuun_pyoholl", level: 10 },
        ],
      },
      {
        id: "yuun_janyeong",
        name: "잔영보(殘影步)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "yuun_dabun", level: 10 },
          { nodeId: "yuun_yeonja", level: 10 },
          { nodeId: "yuun_pyoholl", level: 10 },
        ],
      },
      {
        id: "yuun_capstone",
        name: "무영신법(無影身法)",
        tier: "capstone",
        ...CAPSTONE_COST,
        requires: [
          { nodeId: "yuun_sinhaeng", level: 30 },
          { nodeId: "yuun_janyeong", level: 30 },
        ],
      },
    ],
  },
  {
    id: "taeeul",
    name: "태을혼원공",
    unlockMajor: 7,
    nodes: [
      { id: "taeeul_josik", name: "태을조식법(太乙調息法)", tier: "primary", ...PRIMARY_COST },
      { id: "taeeul_danjeon", name: "혼원단전공(混元丹田功)", tier: "primary", ...PRIMARY_COST },
      { id: "taeeul_jaso", name: "자소진기결(紫霄眞氣訣)", tier: "primary", ...PRIMARY_COST },
      {
        id: "taeeul_gwiil",
        name: "혼원귀일공(混元歸一功)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "taeeul_josik", level: 10 },
          { nodeId: "taeeul_danjeon", level: 10 },
          { nodeId: "taeeul_jaso", level: 10 },
        ],
      },
      {
        id: "taeeul_daejucheon",
        name: "대주천공(大周天功)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "taeeul_josik", level: 10 },
          { nodeId: "taeeul_danjeon", level: 10 },
          { nodeId: "taeeul_jaso", level: 10 },
        ],
      },
      {
        id: "taeeul_capstone",
        name: "태을선천진기(太乙先天眞氣)",
        tier: "capstone",
        ...CAPSTONE_COST,
        requires: [
          { nodeId: "taeeul_gwiil", level: 30 },
          { nodeId: "taeeul_daejucheon", level: 30 },
        ],
      },
    ],
  },
  {
    id: "poklloe",
    name: "폭뢰도법",
    unlockMajor: 9,
    nodes: [
      { id: "poklloe_byeokroe", name: "벽뢰도(霹雷刀)", tier: "primary", ...PRIMARY_COST },
      { id: "poklloe_pasan", name: "파산도(破山刀)", tier: "primary", ...PRIMARY_COST },
      { id: "poklloe_jilpung", name: "질풍도(疾風刀)", tier: "primary", ...PRIMARY_COST },
      {
        id: "poklloe_noejeong",
        name: "뇌정단천도(雷霆斷天刀)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "poklloe_byeokroe", level: 10 },
          { nodeId: "poklloe_pasan", level: 10 },
          { nodeId: "poklloe_jilpung", level: 10 },
        ],
      },
      {
        id: "poklloe_bungnoe",
        name: "붕뢰벽력도(崩雷霹靂刀)",
        tier: "secondary",
        ...SECONDARY_COST,
        requires: [
          { nodeId: "poklloe_byeokroe", level: 10 },
          { nodeId: "poklloe_pasan", level: 10 },
          { nodeId: "poklloe_jilpung", level: 10 },
        ],
      },
      {
        id: "poklloe_capstone",
        name: "일도단뢰(一刀斷雷)",
        tier: "capstone",
        ...CAPSTONE_COST,
        requires: [
          { nodeId: "poklloe_noejeong", level: 30 },
          { nodeId: "poklloe_bungnoe", level: 30 },
        ],
      },
    ],
  },
];

export type GongLevels = Record<string, number>;

export function nodeLevel(node: GongNode, levels: GongLevels): number {
  return levels[node.id] ?? 0;
}

export function nodeUpgradeCost(node: GongNode, currentLevel: number): number {
  return Math.round(node.baseCost * node.growthRate ** currentLevel);
}

export function isNodeUnlocked(node: GongNode, levels: GongLevels): boolean {
  if (!node.requires) return true;
  return node.requires.every((r) => (levels[r.nodeId] ?? 0) >= r.level);
}

export function isBoardUnlocked(board: GongBoard, highestMajorCleared: number): boolean {
  return highestMajorCleared >= board.unlockMajor;
}

export function findBoardByNodeId(nodeId: string): GongBoard | undefined {
  return GONG_BOARDS.find((board) => board.nodes.some((n) => n.id === nodeId));
}

export function boardCompletionPercent(board: GongBoard, levels: GongLevels): number {
  const total = board.nodes.reduce((sum, n) => sum + n.maxLevel, 0);
  const current = board.nodes.reduce((sum, n) => sum + nodeLevel(n, levels), 0);
  return total === 0 ? 0 : Math.round((current / total) * 100);
}

export function totalGongBuffPercent(levels: GongLevels): number {
  return GONG_BOARDS.reduce(
    (sum, board) => sum + board.nodes.reduce((s, node) => s + nodeLevel(node, levels) * node.effectPerLevel, 0),
    0,
  );
}
