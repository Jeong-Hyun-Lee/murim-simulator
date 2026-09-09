// wiki/concepts/무공-시스템.md "수치" 절 그대로 구현 (챕터1 5개 보드 중 1번째, 삼재검법 1보만 v1 범위).

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

export const SAMJAE_BOARD: GongNode[] = [
  { id: "cheon", name: "제1식 천(天)", tier: "primary", maxLevel: 50, baseCost: 30, growthRate: 1.12, effectPerLevel: 0.06 },
  { id: "ji", name: "제2식 지(地)", tier: "primary", maxLevel: 50, baseCost: 30, growthRate: 1.12, effectPerLevel: 0.06 },
  { id: "in", name: "제3식 인(人)", tier: "primary", maxLevel: 50, baseCost: 30, growthRate: 1.12, effectPerLevel: 0.06 },
  {
    id: "habil",
    name: "합일보",
    tier: "secondary",
    maxLevel: 50,
    baseCost: 200,
    growthRate: 1.15,
    effectPerLevel: 0.12,
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
    maxLevel: 50,
    baseCost: 200,
    growthRate: 1.15,
    effectPerLevel: 0.12,
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
    maxLevel: 20,
    baseCost: 2000,
    growthRate: 1.25,
    effectPerLevel: 0.4,
    requires: [
      { nodeId: "habil", level: 30 },
      { nodeId: "sangsaeng", level: 30 },
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

export function totalGongBuffPercent(levels: GongLevels): number {
  return SAMJAE_BOARD.reduce((sum, node) => sum + nodeLevel(node, levels) * node.effectPerLevel, 0);
}
