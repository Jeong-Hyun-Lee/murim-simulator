import { useState } from 'react';
import { useGameStore, elixirExchangeCost } from '../../game/store';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';
import { GachaPanel } from './GachaPanel';

// 일반상점은 shopData.ts의 전(錢)→영약 교환 1종.
const GeneralShopSection = () => {
  const gold = useGameStore((s) => s.gold);
  const elixirExchangeCount = useGameStore((s) => s.elixirExchangeCount);
  const exchangeGoldForElixir = useGameStore((s) => s.exchangeGoldForElixir);

  const cost = elixirExchangeCost(elixirExchangeCount);
  const affordable = gold >= cost;
  const hold = useHoldRepeat(exchangeGoldForElixir, !affordable);

  return (
    <section className="card shop-product-card">
      <div className="shop-product-head">
        <span className="shop-elixir-mark" aria-hidden="true" />
        <div>
          <p className="shop-product-kicker">일반 교환</p>
          <img
            src="/ui/label/sign-shop-elixir.webp"
            alt="영약 교환소"
            style={{ height: '2em', display: 'block' }}
          />
        </div>
        <span className={`shop-stock-state${affordable ? ' is-ready' : ''}`}>
          {affordable ? '교환 가능' : '전 부족'}
        </span>
      </div>
      <p className="muted">
        &quot;쇠는 두드릴수록 강해지지만, 영약은 은자로 산다지.&quot; 노(老)씨가 웃으며 말했다.
      </p>
      <dl className="stat-list">
        <div className="stat-row">
          <dt>다음 1개 비용</dt>
          <dd>전 {cost.toLocaleString()}</dd>
        </div>
        <div className="stat-row">
          <dt>보유 전</dt>
          <dd>{gold.toLocaleString()}</dd>
        </div>
        <div className="stat-row">
          <dt>구매 후 잔액</dt>
          <dd>{affordable ? (gold - cost).toLocaleString() : '전 부족'}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="btn btn-primary btn-block hold-btn"
        disabled={!affordable}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...hold}
      >
        <img
          src="/ui/label/label-shop-exchange.webp"
          alt="영약 1개 교환"
          style={{ height: '1.1em', display: 'block' }}
        />
        <small>(전 {cost.toLocaleString()})</small>
      </button>
    </section>
  );
};

type ShopTab = 'general' | 'gacha';

export const ShopPanel = () => {
  const [tab, setTab] = useState<ShopTab>('general');

  return (
    <div className="shop-tab">
      <div className="segmented" role="tablist" aria-label="상점 구분">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'general'}
          className={`segmented-btn${tab === 'general' ? ' segmented-btn-active' : ''}`}
          onClick={() => setTab('general')}
        >
          <img
            src="/ui/label/label-subtab-general.webp"
            alt="일반상점"
            style={{ height: '1.1em' }}
          />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'gacha'}
          className={`segmented-btn${tab === 'gacha' ? ' segmented-btn-active' : ''}`}
          onClick={() => setTab('gacha')}
        >
          기연(奇緣)
        </button>
      </div>
      {/* 두 소탭을 모두 유지해 소탭 전환이 미확인 뽑기 결과를 지우지 않게 한다. */}
      <div hidden={tab !== 'general'}>
        <GeneralShopSection />
      </div>
      <div hidden={tab !== 'gacha'}>
        <GachaPanel />
      </div>
    </div>
  );
};
