import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// 하단 시트 — 네이티브 <dialog>.showModal()이 초점 가두기·Esc 닫기·닫은 뒤 호출 버튼으로
// 초점 복귀를 처리한다. 닫기/Esc/바깥 탭은 모두 close 이벤트 하나로 모여 소비를 실행하지 않는다.
export const Sheet = ({ title, onClose, children }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const close = () => ref.current?.close();

  return (
    // 바깥(backdrop) 탭 닫기용 클릭 — 키보드 닫기는 네이티브 Esc가 담당.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="sheet-inner">
        <div className="sheet-header">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={close}>
            닫기
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </dialog>
  );
};
