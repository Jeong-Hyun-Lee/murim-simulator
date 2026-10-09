// 빌드 산출물(dist)의 캐릭터 스프라이트 시트 PNG를 WebP로 바꿔 내려받기 용량을 줄인다.
// assets/의 원본 PNG는 건드리지 않는다 — 개발 서버와 에셋 생성 도구는 계속 PNG를 쓴다.
// 알파는 무손실, 색은 품질 95(3배 확대 비교에서 원본과 구분되지 않는 수준, 용량 약 30%).
import { readdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.resolve('dist/sprites/character');
const QUALITY = 95;

const sheets = (await readdir(DIR)).filter((name) => name.endsWith('-sheet.json'));
let before = 0;
let after = 0;

for (const name of sheets) {
  const jsonPath = path.join(DIR, name);
  const sheet = JSON.parse(await readFile(jsonPath, 'utf8'));
  const image = sheet.meta?.image;
  if (typeof image === 'string' && image.endsWith('.png')) {
    const pngPath = path.join(DIR, image);
    const webpName = image.replace(/\.png$/, '.webp');
    const webpPath = path.join(DIR, webpName);
    await sharp(pngPath).webp({ quality: QUALITY, alphaQuality: 100, effort: 4 }).toFile(webpPath);
    before += (await stat(pngPath)).size;
    after += (await stat(webpPath)).size;
    await rm(pngPath);
    sheet.meta.image = webpName;
    await writeFile(jsonPath, JSON.stringify(sheet));
  }
}

const mb = (bytes) => (bytes / 1e6).toFixed(1);
console.log(`sprite sheets: ${sheets.length} files, ${mb(before)}MB -> ${mb(after)}MB`);
