import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// assets/ 폴더가 게임 원본 에셋 저장소(위키 규칙)이자 정적 서빙 루트를 겸함 —
// 별도 public/ 폴더로 파일을 복제하지 않기 위해 publicDir을 여기로 지정.
export default defineConfig({
  plugins: [react()],
  publicDir: "assets",
});
