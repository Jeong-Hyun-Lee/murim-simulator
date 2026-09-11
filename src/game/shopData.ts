// wiki/concepts/상점-기연-시스템.md "영약 공급처" 표의 "일반상점 구매" 항목 v1 구현.
// ponytail: 실결제 상품/특별패키지·소모품 카테고리는 결제 인프라·인벤토리가 없어 범위 밖 —
// 전(錢)→영약 교환 1종만 구현. 교환 비용은 위키에 수치가 없어 무기 강화 비용과 동일한
// 체증 곡선(BaseCost × GrowthRate^구매횟수)으로 근사 신규 정의.

export const ELIXIR_EXCHANGE_BASE_COST = 500; // 전(錢)
const ELIXIR_EXCHANGE_GROWTH = 1.2;

export const elixirExchangeCost = (purchaseCount: number): number =>
  Math.round(ELIXIR_EXCHANGE_BASE_COST * ELIXIR_EXCHANGE_GROWTH ** purchaseCount);
