import { useState } from 'react';
import { useGameStore } from '../game/store';

// UX 기획 4장(핵심 사용자 플로우) 1~2단계 v1 구현.
// ponytail: "3~4장의 정지 일러스트" 연출은 캐릭터 컨셉아트 외 별도 일러스트 자산이 없어
// 텍스트 대사 카드로 축소(배경/이펙트 없이). 3단계("수련 시작" 버튼)는 BossDialog와 동일한
// "확인 전까지 자동전투 정지" 게이팅(App.tsx의 !onboardingDone 조건)으로 대체.
const INTRO_CARDS = [
  '정신을 차리니 낯선 절벽 위였다. 방금까지 도시 한복판에 있었는데...',
  '옷차림도, 말투도, 하늘빛조차 현대의 것이 아니다. 사극 세트장이라기엔 너무 생생하다.',
  '"이보시오, 정신이 드시오?" 한 도인이 손을 내밀며 물었다. "여기는... 무림(武林)이라 하오."',
];

type Step = 'intro' | 'nickname';

export const OnboardingFlow = () => {
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const [step, setStep] = useState<Step>('intro');
  const [cardIndex, setCardIndex] = useState(0);
  const [nicknameInput, setNicknameInput] = useState('');

  const nextCard = () => {
    if (cardIndex < INTRO_CARDS.length - 1) setCardIndex((i) => i + 1);
    else setStep('nickname');
  };

  return (
    <div className="onboarding-overlay">
      {step === 'intro' ? (
        <div className="onboarding-box">
          <button type="button" className="onboarding-skip-btn" onClick={() => setStep('nickname')}>
            SKIP
          </button>
          <p className="onboarding-text">{INTRO_CARDS[cardIndex]}</p>
          <button type="button" className="gong-upgrade-btn" onClick={nextCard}>
            다음
          </button>
        </div>
      ) : (
        <div className="onboarding-box">
          <p className="onboarding-text">그대의 도호(별명)를 무엇이라 부르면 되겠소?</p>
          <input
            className="onboarding-input"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            placeholder="목현"
            maxLength={8}
          />
          <div className="equip-detail-actions">
            <button
              type="button"
              className="gong-upgrade-btn"
              onClick={() => completeOnboarding(nicknameInput)}
            >
              확인
            </button>
            <button
              type="button"
              className="panel-close-btn"
              onClick={() => completeOnboarding('')}
            >
              스킵(기본값)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
