import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// assets/ 폴더가 게임 원본 에셋 저장소(위키 규칙)이자 정적 서빙 루트를 겸함 —
// 별도 public/ 폴더로 파일을 복제하지 않기 위해 publicDir을 여기로 지정.
export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  server: {
    port: 5000,
  },
  // 모바일 지원 하한을 명시 — iOS 14 Safari·안드로이드 크롬 87 이상. esbuild가 이 기준으로
  // JS 문법(??=, ?. 등)과 CSS(inset → top/right/bottom/left 등)를 낮춰 출력한다.
  build: {
    target: ['es2020', 'safari14', 'ios14', 'chrome87'],
    cssTarget: ['safari14', 'ios14', 'chrome87'],
  },
});
