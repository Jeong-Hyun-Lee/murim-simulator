// wiki/concepts/무공-시스템.md "수치" 절 그대로 구현 — 챕터1 5개 보드 전부.
// 보드 2~5(회선장법/유운경신술/태을혼원공/폭뢰도법)의 개별 초식명은 위키에 정의돼 있지 않아
// 2026-09-10 신규 명명(장법/경신술/심법/도법 각 계열 테마에 맞춰 작명), 위키에도 동일 반영.
// 삼재검법 2보(문파무공, 2026-09-10 추가)는 UX 기획 2-4절이 예고한
// "삼재검법 1보 오의(캡스톤) 대성 시 개방"을 그대로 구현, 강화 재화는 문파-시스템.md 스펙대로
// 기여도(내공 아님) — GongBoard.currency/unlock으로 일반화.

export type NodeTier = 'primary' | 'secondary' | 'capstone';
export type GongCurrency = 'chi' | 'contribution';

// 노드가 어느 스탯을 키우는지. "power"(기본값)는 기존 방식대로 ATK/DEF/HP 공통 가산버프
// 버킷(totalGongBuffPercent)에 합산되고, 그 외는 장구와 동일한 방식으로 해당 보조 스탯에
// 직접 가산된다(totalGongSecondaryStats 참고, 2026-09-11 추가 — 질풍살검 보드).
export type GongStatKey =
  'power' | 'critChance' | 'critDamage' | 'attackSpeed' | 'evasion' | 'chiGain';

export interface GongNode {
  id: string;
  name: string;
  tier: NodeTier;
  maxLevel: number;
  baseCost: number;
  growthRate: number;
  effectPerLevel: number; // 레벨당 효과 % (statKey가 가리키는 스탯 기준)
  statKey?: GongStatKey; // 생략 시 "power"
  requires?: { nodeId: string; level: number }[];
}

export type BoardUnlockCondition =
  | { type: 'stage'; major: number } // highestMajorCleared >= major
  | { type: 'nodeMaxed'; boardId: string; nodeId: string }; // 다른 보드의 특정 노드가 대성이어야 함

export interface GongBoard {
  id: string;
  name: string;
  currency: GongCurrency;
  unlock: BoardUnlockCondition;
  nodes: GongNode[];
  // true면 공통 가산 버킷 대신 이 보드 효과만큼 최종 HP·ATK·DEF를 따로 곱한다(챕터2 이후 보드).
  multiplicative?: boolean;
}

const PRIMARY_COST = {
  baseCost: 30,
  growthRate: 1.12,
  effectPerLevel: 0.06,
  maxLevel: 50,
} as const;
const SECONDARY_COST = {
  baseCost: 200,
  growthRate: 1.15,
  effectPerLevel: 0.12,
  maxLevel: 50,
} as const;
const CAPSTONE_COST = {
  baseCost: 2000,
  growthRate: 1.25,
  effectPerLevel: 0.4,
  maxLevel: 20,
} as const;

// wiki/concepts/문파-시스템.md "문파무공(태극권 등) 해금 총량" 표 — BaseCost/최대Lv만 명시,
// 레벨당 효과%는 명시 없어 다른 보드와 동일 표(0.06/0.12/0.4%)를 그대로 재사용.
const SECT_PRIMARY_COST = {
  baseCost: 20,
  growthRate: 1.13,
  effectPerLevel: 0.06,
  maxLevel: 30,
} as const;
const SECT_SECONDARY_COST = {
  baseCost: 100,
  growthRate: 1.13,
  effectPerLevel: 0.12,
  maxLevel: 30,
} as const;
const SECT_CAPSTONE_COST = {
  baseCost: 800,
  growthRate: 1.13,
  effectPerLevel: 0.4,
  maxLevel: 10,
} as const;

// 오의(capstone)는 공격·방어·체력 대신 보조 스탯 하나를 소폭 올린다. 값은 대성 시 합계(%)이고,
// 레벨당 효과는 최대 레벨로 나눠 보드 종류(최대 Lv 20/10)와 관계없이 대성 합계가 같다.
type SecondaryStatKey = Exclude<GongStatKey, 'power'>;
const CAPSTONE_STAT_TOTAL: Record<SecondaryStatKey, number> = {
  critChance: 2,
  critDamage: 6,
  attackSpeed: 3,
  evasion: 1.5,
  chiGain: 5,
};
const capstoneStat = (statKey: SecondaryStatKey, maxLevel: number) => ({
  statKey,
  effectPerLevel: CAPSTONE_STAT_TOTAL[statKey] / maxLevel,
});

// 무공-시스템.md "챕터2·3 신규 보드" — 대11부터 두 대스테이지마다 1개. 트리·성장률은 챕터1과 같고,
// 비용은 해금 구간 내공 수입에 맞춰 × 1.8^(해금대−1) ÷ 10, 효과는 챕터1 표의 절반, 보드별 곱연산.
const CHAPTER_BOARD_EFFECT_RATIO = 0.5;
const CHAPTER_BOARD_COST_DIVISOR = 10;

interface ChapterBoardSpec {
  id: string;
  name: string;
  unlockMajor: number;
  primary: [string, string, string];
  secondary: [string, string];
  capstone: string;
  capstoneStat: SecondaryStatKey;
}

const chapterBoard = ({
  id,
  name,
  unlockMajor,
  primary,
  secondary,
  capstone,
  capstoneStat: capstoneStatKey,
}: ChapterBoardSpec): GongBoard => {
  const costScale = 1.8 ** (unlockMajor - 1) / CHAPTER_BOARD_COST_DIVISOR;
  const tier = (cost: typeof PRIMARY_COST | typeof SECONDARY_COST | typeof CAPSTONE_COST) => ({
    maxLevel: cost.maxLevel,
    growthRate: cost.growthRate,
    baseCost: Math.round(cost.baseCost * costScale),
    effectPerLevel: cost.effectPerLevel * CHAPTER_BOARD_EFFECT_RATIO,
  });
  const primaryIds = primary.map((_, i) => `${id}_p${i + 1}`);
  const secondaryIds = secondary.map((_, i) => `${id}_s${i + 1}`);
  return {
    id,
    name,
    currency: 'chi',
    unlock: { type: 'stage', major: unlockMajor },
    multiplicative: true,
    nodes: [
      ...primary.map((n, i) => ({
        id: primaryIds[i],
        name: n,
        tier: 'primary' as const,
        ...tier(PRIMARY_COST),
      })),
      ...secondary.map((n, i) => ({
        id: secondaryIds[i],
        name: n,
        tier: 'secondary' as const,
        ...tier(SECONDARY_COST),
        requires: primaryIds.map((nodeId) => ({ nodeId, level: 10 })),
      })),
      {
        id: `${id}_c`,
        name: capstone,
        tier: 'capstone',
        ...tier(CAPSTONE_COST),
        ...capstoneStat(capstoneStatKey, CAPSTONE_COST.maxLevel),
        requires: secondaryIds.map((nodeId) => ({ nodeId, level: 30 })),
      },
    ],
  };
};

const CHAPTER_BOARD_SPECS: ChapterBoardSpec[] = [
  {
    id: 'cheongungeomgyeol',
    name: '청운검결(靑雲劍訣)',
    unlockMajor: 11,
    primary: ['운해(雲海)', '운봉(雲峰)', '운류(雲流)'],
    secondary: ['청운회검(靑雲回劍)', '청운쌍류(靑雲雙流)'],
    capstone: '청운만리(靑雲萬里)',
    capstoneStat: 'critChance',
  },
  {
    id: 'changnyong_oepyeon',
    name: '창룡검법 외편(蒼龍劍法 外篇)',
    unlockMajor: 13,
    primary: ['승룡세(昇龍勢)', '반룡세(蟠龍勢)', '와룡세(臥龍勢)'],
    secondary: ['창룡출해(蒼龍出海)', '쌍룡쟁주(雙龍爭珠)'],
    capstone: '창룡승천(蒼龍昇天)',
    capstoneStat: 'critDamage',
  },
  {
    id: 'amhyangpyo',
    name: '암향표(暗香飄)',
    unlockMajor: 15,
    primary: ['매영보(梅影步)', '낙화보(落花步)', '향풍보(香風步)'],
    secondary: ['암향부동(暗香浮動)', '매화난영(梅花亂影)'],
    capstone: '매화만천(梅花滿天)',
    capstoneStat: 'evasion',
  },
  {
    id: 'yeokcheonjingi',
    name: '역천진기(逆天眞氣)',
    unlockMajor: 17,
    primary: ['역맥(逆脈)', '순맥(順脈)', '환맥(環脈)'],
    secondary: ['역천환원(逆天還元)', '진기쇄정(眞氣鎖定)'],
    capstone: '역천개문(逆天開門)',
    capstoneStat: 'chiGain',
  },
  {
    id: 'gyeolsajingyeol',
    name: '결사진결(結死陣訣)',
    unlockMajor: 19,
    primary: ['천강진보(天罡陣步)', '지살진보(地煞陣步)', '사상진보(四象陣步)'],
    secondary: ['팔괘연환(八卦連環)', '구궁쇄진(九宮鎖陣)'],
    capstone: '결사일진(結死一陣)',
    capstoneStat: 'critChance',
  },
  {
    id: 'pasasingong',
    name: '파사신공(破邪神功)',
    unlockMajor: 21,
    primary: ['정심결(淨心訣)', '척사결(斥邪訣)', '호신강기(護身罡氣)'],
    secondary: ['파사현정(破邪顯正)', '청명심경(淸明心鏡)'],
    capstone: '파사신강(破邪神罡)',
    capstoneStat: 'critDamage',
  },
  {
    id: 'hyeoldochimbeop',
    name: '혈도침법(穴道鍼法)',
    unlockMajor: 23,
    primary: ['백회침(百會鍼)', '단중침(膻中鍼)', '용천침(湧泉鍼)'],
    secondary: ['경락통달(經絡通達)', '기혈순환(氣血循環)'],
    capstone: '금침도맥(金鍼導脈)',
    capstoneStat: 'critChance',
  },
  {
    id: 'eunhonbo',
    name: '은혼보(隱魂步)',
    unlockMajor: 25,
    primary: ['무성보(無聲步)', '무형보(無形步)', '무혼보(無魂步)'],
    secondary: ['은혼잠영(隱魂潛影)', '탐혼역추(探魂逆追)'],
    capstone: '은혼멸적(隱魂滅迹)',
    capstoneStat: 'evasion',
  },
  {
    id: 'gangryukwaegeom',
    name: '강류쾌검(姜流快劍)',
    unlockMajor: 27,
    primary: ['일섬(一閃)', '돌진(突進)', '반격(反擊)'],
    secondary: ['쾌검연환(快劍連環)', '일점돌파(一點突破)'],
    capstone: '강류일섬(姜流一閃)',
    capstoneStat: 'attackSpeed',
  },
  {
    id: 'simgeomgyeol',
    name: '심검결(心劍訣)',
    unlockMajor: 29,
    primary: ['의검(意劍)', '기검(氣劍)', '심검(心劍)'],
    secondary: ['무형검기(無形劍氣)', '이심전검(以心傳劍)'],
    capstone: '심검합일(心劍合一)',
    capstoneStat: 'chiGain',
  },
];
const CHAPTER_BOARDS = CHAPTER_BOARD_SPECS.map(chapterBoard);

export const GONG_BOARDS: GongBoard[] = [
  {
    id: 'samjae1',
    name: '삼재검법 1보',
    currency: 'chi',
    unlock: { type: 'stage', major: 0 },
    nodes: [
      { id: 'cheon', name: '제1식 천(天)', tier: 'primary', ...PRIMARY_COST },
      { id: 'ji', name: '제2식 지(地)', tier: 'primary', ...PRIMARY_COST },
      { id: 'in', name: '제3식 인(人)', tier: 'primary', ...PRIMARY_COST },
      {
        id: 'habil',
        name: '합일보',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'cheon', level: 10 },
          { nodeId: 'ji', level: 10 },
          { nodeId: 'in', level: 10 },
        ],
      },
      {
        id: 'sangsaeng',
        name: '삼재상생',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'cheon', level: 10 },
          { nodeId: 'ji', level: 10 },
          { nodeId: 'in', level: 10 },
        ],
      },
      {
        id: 'capstone',
        name: '삼재합일',
        tier: 'capstone',
        ...CAPSTONE_COST,
        ...capstoneStat('critChance', CAPSTONE_COST.maxLevel),
        requires: [
          { nodeId: 'habil', level: 30 },
          { nodeId: 'sangsaeng', level: 30 },
        ],
      },
    ],
  },
  {
    id: 'hoeseon',
    name: '회선장법',
    currency: 'chi',
    unlock: { type: 'stage', major: 3 },
    nodes: [
      { id: 'hoeseon_seonpung', name: '선풍장(旋風掌)', tier: 'primary', ...PRIMARY_COST },
      { id: 'hoeseon_bungsan', name: '붕산장(崩山掌)', tier: 'primary', ...PRIMARY_COST },
      { id: 'hoeseon_bokho', name: '복호장(伏虎掌)', tier: 'primary', ...PRIMARY_COST },
      {
        id: 'hoeseon_yeonhwan',
        name: '연환삼장(連環三掌)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'hoeseon_seonpung', level: 10 },
          { nodeId: 'hoeseon_bungsan', level: 10 },
          { nodeId: 'hoeseon_bokho', level: 10 },
        ],
      },
      {
        id: 'hoeseon_gwangpung',
        name: '광풍벽력장(狂風霹靂掌)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'hoeseon_seonpung', level: 10 },
          { nodeId: 'hoeseon_bungsan', level: 10 },
          { nodeId: 'hoeseon_bokho', level: 10 },
        ],
      },
      {
        id: 'hoeseon_capstone',
        name: '회선붕천장(回旋崩天掌)',
        tier: 'capstone',
        ...CAPSTONE_COST,
        ...capstoneStat('critDamage', CAPSTONE_COST.maxLevel),
        requires: [
          { nodeId: 'hoeseon_yeonhwan', level: 30 },
          { nodeId: 'hoeseon_gwangpung', level: 30 },
        ],
      },
    ],
  },
  {
    id: 'yuun',
    name: '유운경신술',
    currency: 'chi',
    unlock: { type: 'stage', major: 5 },
    nodes: [
      { id: 'yuun_dabun', name: '답운보(踏雲步)', tier: 'primary', ...PRIMARY_COST },
      { id: 'yuun_yeonja', name: '연자보(燕子步)', tier: 'primary', ...PRIMARY_COST },
      { id: 'yuun_pyoholl', name: '표홀신법(飄忽身法)', tier: 'primary', ...PRIMARY_COST },
      {
        id: 'yuun_sinhaeng',
        name: '유운신행(流雲身行)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'yuun_dabun', level: 10 },
          { nodeId: 'yuun_yeonja', level: 10 },
          { nodeId: 'yuun_pyoholl', level: 10 },
        ],
      },
      {
        id: 'yuun_janyeong',
        name: '잔영보(殘影步)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'yuun_dabun', level: 10 },
          { nodeId: 'yuun_yeonja', level: 10 },
          { nodeId: 'yuun_pyoholl', level: 10 },
        ],
      },
      {
        id: 'yuun_capstone',
        name: '무영신법(無影身法)',
        tier: 'capstone',
        ...CAPSTONE_COST,
        ...capstoneStat('evasion', CAPSTONE_COST.maxLevel),
        requires: [
          { nodeId: 'yuun_sinhaeng', level: 30 },
          { nodeId: 'yuun_janyeong', level: 30 },
        ],
      },
    ],
  },
  {
    id: 'taeeul',
    name: '태을혼원공',
    currency: 'chi',
    unlock: { type: 'stage', major: 7 },
    nodes: [
      { id: 'taeeul_josik', name: '태을조식법(太乙調息法)', tier: 'primary', ...PRIMARY_COST },
      { id: 'taeeul_danjeon', name: '혼원단전공(混元丹田功)', tier: 'primary', ...PRIMARY_COST },
      { id: 'taeeul_jaso', name: '자소진기결(紫霄眞氣訣)', tier: 'primary', ...PRIMARY_COST },
      {
        id: 'taeeul_gwiil',
        name: '혼원귀일공(混元歸一功)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'taeeul_josik', level: 10 },
          { nodeId: 'taeeul_danjeon', level: 10 },
          { nodeId: 'taeeul_jaso', level: 10 },
        ],
      },
      {
        id: 'taeeul_daejucheon',
        name: '대주천공(大周天功)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'taeeul_josik', level: 10 },
          { nodeId: 'taeeul_danjeon', level: 10 },
          { nodeId: 'taeeul_jaso', level: 10 },
        ],
      },
      {
        id: 'taeeul_capstone',
        name: '태을선천진기(太乙先天眞氣)',
        tier: 'capstone',
        ...CAPSTONE_COST,
        ...capstoneStat('chiGain', CAPSTONE_COST.maxLevel),
        requires: [
          { nodeId: 'taeeul_gwiil', level: 30 },
          { nodeId: 'taeeul_daejucheon', level: 30 },
        ],
      },
    ],
  },
  {
    id: 'poklloe',
    name: '폭뢰도법',
    currency: 'chi',
    unlock: { type: 'stage', major: 9 },
    nodes: [
      { id: 'poklloe_byeokroe', name: '벽뢰도(霹雷刀)', tier: 'primary', ...PRIMARY_COST },
      { id: 'poklloe_pasan', name: '파산도(破山刀)', tier: 'primary', ...PRIMARY_COST },
      { id: 'poklloe_jilpung', name: '질풍도(疾風刀)', tier: 'primary', ...PRIMARY_COST },
      {
        id: 'poklloe_noejeong',
        name: '뇌정단천도(雷霆斷天刀)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'poklloe_byeokroe', level: 10 },
          { nodeId: 'poklloe_pasan', level: 10 },
          { nodeId: 'poklloe_jilpung', level: 10 },
        ],
      },
      {
        id: 'poklloe_bungnoe',
        name: '붕뢰벽력도(崩雷霹靂刀)',
        tier: 'secondary',
        ...SECONDARY_COST,
        requires: [
          { nodeId: 'poklloe_byeokroe', level: 10 },
          { nodeId: 'poklloe_pasan', level: 10 },
          { nodeId: 'poklloe_jilpung', level: 10 },
        ],
      },
      {
        id: 'poklloe_capstone',
        name: '일도단뢰(一刀斷雷)',
        tier: 'capstone',
        ...CAPSTONE_COST,
        ...capstoneStat('attackSpeed', CAPSTONE_COST.maxLevel),
        requires: [
          { nodeId: 'poklloe_noejeong', level: 30 },
          { nodeId: 'poklloe_bungnoe', level: 30 },
        ],
      },
    ],
  },
  {
    // wiki/concepts/무공-시스템.md "질풍살검" 절 — 챕터1 5개 보드가 전부 ATK/DEF/HP 공통
    // 버프%(power)만 주는 것과 달리, 이 보드는 치명타확률/치명타피해/공격속도/회피를 장구와
    // 동일한 방식으로 직접 가산(2026-09-11 추가). 대스테이지 번호에 직접 걸지 않고 폭뢰도법
    // 대성(챕터1 마지막 보드)을 조건으로 삼아, 이후 챕터/스테이지 번호 체계가 바뀌어도
    // "챕터1 전 보드 마스터 후 개방"이라는 의미가 그대로 유지되게 함.
    id: 'jilpungsalgeom',
    name: '질풍살검(疾風殺劍)',
    currency: 'chi',
    unlock: { type: 'nodeMaxed', boardId: 'poklloe', nodeId: 'poklloe_capstone' },
    nodes: [
      {
        id: 'jpsg_kwaesu',
        name: '쾌수(快手)',
        tier: 'primary',
        statKey: 'attackSpeed',
        ...PRIMARY_COST,
        effectPerLevel: 0.2,
      },
      {
        id: 'jpsg_yean',
        name: '예안(銳眼)',
        tier: 'primary',
        statKey: 'critChance',
        ...PRIMARY_COST,
        effectPerLevel: 0.1,
      },
      {
        id: 'jpsg_pilsal',
        name: '필살(必殺)',
        tier: 'primary',
        statKey: 'critDamage',
        ...PRIMARY_COST,
        effectPerLevel: 0.3,
      },
      {
        id: 'jpsg_ilgyeok',
        name: '일격필살(一擊必殺)',
        tier: 'secondary',
        statKey: 'critDamage',
        ...SECONDARY_COST,
        effectPerLevel: 0.4,
        requires: [
          { nodeId: 'jpsg_kwaesu', level: 10 },
          { nodeId: 'jpsg_yean', level: 10 },
          { nodeId: 'jpsg_pilsal', level: 10 },
        ],
      },
      {
        id: 'jpsg_soaeyeong',
        name: '쇄영보(碎影步)',
        tier: 'secondary',
        statKey: 'evasion',
        ...SECONDARY_COST,
        effectPerLevel: 0.15,
        requires: [
          { nodeId: 'jpsg_kwaesu', level: 10 },
          { nodeId: 'jpsg_yean', level: 10 },
          { nodeId: 'jpsg_pilsal', level: 10 },
        ],
      },
      {
        id: 'jpsg_capstone',
        name: '무영쾌검(無影快劍)',
        tier: 'capstone',
        statKey: 'attackSpeed',
        ...CAPSTONE_COST,
        effectPerLevel: 0.5,
        requires: [
          { nodeId: 'jpsg_ilgyeok', level: 30 },
          { nodeId: 'jpsg_soaeyeong', level: 30 },
        ],
      },
    ],
  },
  {
    // UX 기획 2-4절 "상위 보드(삼재검법 2보)는 하위 보드(삼재검법
    // 1보)의 오의 노드(삼재합일)가 대성 상태여야 개방" 그대로 구현. 문파-시스템.md의
    // 문파무공(청운문 전용 심화 무공) 해금 스펙(기여도 재화, BaseCost/최대Lv)을 이 보드로 구현 —
    // 청운문의 시그니처는 이미 삼재검법 계열이므로 "화산검법" 같은 별도 문파무공명 대신
    // 삼재검법의 심화판으로 자연스럽게 이어지도록 명명.
    id: 'samjae2',
    name: '삼재검법 2보',
    currency: 'contribution',
    unlock: { type: 'nodeMaxed', boardId: 'samjae1', nodeId: 'capstone' },
    nodes: [
      { id: 'samjae2_cheonoe', name: '제1식 천외(天外)', tier: 'primary', ...SECT_PRIMARY_COST },
      { id: 'samjae2_jimaek', name: '제2식 지맥(地脈)', tier: 'primary', ...SECT_PRIMARY_COST },
      { id: 'samjae2_inyeong', name: '제3식 인영(人影)', tier: 'primary', ...SECT_PRIMARY_COST },
      {
        id: 'samjae2_hyeonhap',
        name: '천지현합(天地玄合)',
        tier: 'secondary',
        ...SECT_SECONDARY_COST,
        requires: [
          { nodeId: 'samjae2_cheonoe', level: 10 },
          { nodeId: 'samjae2_jimaek', level: 10 },
          { nodeId: 'samjae2_inyeong', level: 10 },
        ],
      },
      {
        id: 'samjae2_ilche',
        name: '인검일체(人劍一體)',
        tier: 'secondary',
        ...SECT_SECONDARY_COST,
        requires: [
          { nodeId: 'samjae2_cheonoe', level: 10 },
          { nodeId: 'samjae2_jimaek', level: 10 },
          { nodeId: 'samjae2_inyeong', level: 10 },
        ],
      },
      {
        id: 'samjae2_capstone',
        name: '삼재무극검(三才無極劍)',
        tier: 'capstone',
        ...SECT_CAPSTONE_COST,
        ...capstoneStat('critDamage', SECT_CAPSTONE_COST.maxLevel),
        requires: [
          { nodeId: 'samjae2_hyeonhap', level: 20 },
          { nodeId: 'samjae2_ilche', level: 20 },
        ],
      },
    ],
  },
  ...CHAPTER_BOARDS,
];

export type GongLevels = Record<string, number>;

export const nodeLevel = (node: GongNode, levels: GongLevels): number => levels[node.id] ?? 0;

export const nodeUpgradeCost = (node: GongNode, currentLevel: number): number =>
  Math.round(node.baseCost * node.growthRate ** currentLevel);

// UX 기획 2-3절 "10연마"(비용 10배로 즉시 10레벨 강화) 보조 버튼.
// "10배"는 다음 레벨 1회분 비용 기준 정액 할인/할증이 아니라, 실제로 오를 각 레벨의 개별
// 비용을 그대로 합산 — 위키의 "대성 총 내공" 표와 동일한 계산 방식을 재사용해 이중 기준이
// 생기지 않도록 함. 최대 레벨 근처에서는 남은 레벨만큼만 적용.
export const BULK_UPGRADE_SIZE = 10;

export const nodeBulkUpgrade = (
  node: GongNode,
  currentLevel: number,
): { levelsGained: number; cost: number } => {
  const levelsGained = Math.min(BULK_UPGRADE_SIZE, node.maxLevel - currentLevel);
  let cost = 0;
  for (let i = 0; i < levelsGained; i += 1) {
    cost += nodeUpgradeCost(node, currentLevel + i);
  }
  return { levelsGained, cost };
};

export const isNodeUnlocked = (node: GongNode, levels: GongLevels): boolean => {
  if (!node.requires) return true;
  return node.requires.every((r) => (levels[r.nodeId] ?? 0) >= r.level);
};

export interface BoardUnlockContext {
  highestMajorCleared: number;
  gongLevels: GongLevels;
}

export const isBoardUnlocked = (board: GongBoard, ctx: BoardUnlockContext): boolean => {
  const { unlock } = board;
  if (unlock.type === 'stage') return ctx.highestMajorCleared >= unlock.major;
  const sourceBoard = GONG_BOARDS.find((b) => b.id === unlock.boardId);
  const sourceNode = sourceBoard?.nodes.find((n) => n.id === unlock.nodeId);
  if (!sourceNode) return false;
  return nodeLevel(sourceNode, ctx.gongLevels) >= sourceNode.maxLevel;
};

export const findBoardByNodeId = (nodeId: string): GongBoard | undefined =>
  GONG_BOARDS.find((board) => board.nodes.some((n) => n.id === nodeId));

export const boardUnlockLabel = (board: GongBoard): string => {
  const { unlock } = board;
  if (unlock.type === 'stage') return `대${unlock.major} 보스 클리어 후 해금됩니다.`;
  const sourceBoard = GONG_BOARDS.find((b) => b.id === unlock.boardId);
  const sourceNode = sourceBoard?.nodes.find((n) => n.id === unlock.nodeId);
  return `${sourceBoard?.name ?? ''} "${sourceNode?.name ?? ''}" 대성 후 해금됩니다.`;
};

export const boardCompletionPercent = (board: GongBoard, levels: GongLevels): number => {
  const total = board.nodes.reduce((sum, n) => sum + n.maxLevel, 0);
  const current = board.nodes.reduce((sum, n) => sum + nodeLevel(n, levels), 0);
  return total === 0 ? 0 : Math.round((current / total) * 100);
};

// 보드 하나의 공격·방어·체력 효과 합(%). 보조 스탯 노드는 제외.
export const boardPowerPercent = (board: GongBoard, levels: GongLevels): number =>
  board.nodes.reduce(
    (s, node) =>
      (node.statKey ?? 'power') === 'power' ? s + nodeLevel(node, levels) * node.effectPerLevel : s,
    0,
  );

// 공통 가산 버킷에 들어가는 무공 효과(%) — 곱연산 보드는 제외.
export const totalGongBuffPercent = (levels: GongLevels): number =>
  GONG_BOARDS.reduce(
    (sum, board) => (board.multiplicative ? sum : sum + boardPowerPercent(board, levels)),
    0,
  );

// 곱연산 보드 배율 — 최종 HP·ATK·DEF에 곱한다. Π(1 + 보드 효과%/100).
export const gongMultiplier = (levels: GongLevels): number =>
  GONG_BOARDS.reduce(
    (mult, board) =>
      board.multiplicative ? mult * (1 + boardPowerPercent(board, levels) / 100) : mult,
    1,
  );

export interface GongSecondaryStats {
  critChancePercent: number;
  critDamagePercent: number;
  attackSpeedPercent: number;
  evasionPercent: number;
  chiGainPercent: number;
}

const SECONDARY_STAT_FIELD: Record<Exclude<GongStatKey, 'power'>, keyof GongSecondaryStats> = {
  critChance: 'critChancePercent',
  critDamage: 'critDamagePercent',
  attackSpeed: 'attackSpeedPercent',
  evasion: 'evasionPercent',
  chiGain: 'chiGainPercent',
};

// 질풍살검처럼 ATK/DEF/HP 공통 버프가 아니라 치명타/공격속도/회피 등 개별 스탯을 직접 키우는
// 노드의 합계 — 장구와 동일한 방식(playerStats의 gear 인자)으로 합산된다.
export const totalGongSecondaryStats = (levels: GongLevels): GongSecondaryStats => {
  const stats: GongSecondaryStats = {
    critChancePercent: 0,
    critDamagePercent: 0,
    attackSpeedPercent: 0,
    evasionPercent: 0,
    chiGainPercent: 0,
  };
  for (const board of GONG_BOARDS) {
    for (const node of board.nodes.filter((n) => (n.statKey ?? 'power') !== 'power')) {
      const key = node.statKey as Exclude<GongStatKey, 'power'>;
      stats[SECONDARY_STAT_FIELD[key]] += nodeLevel(node, levels) * node.effectPerLevel;
    }
  }
  return stats;
};
