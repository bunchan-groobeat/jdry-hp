// ジェイラップ様のサイトへのボタンを戻す（2026-10-18 じろう）
//   使い方: node C:/HQ/projects/jdry-hp-src/_tools/jrap-link-on.mjs
//   index.html の JRAP-LINK-OFF の目印（開始の2行・終了の1行）だけを消す。中の2行（説明文とボタン）はそのまま表に出る。
//   ★戻す前に https://ssl.j-rap.co.jp/business/process.html が警告なしで開くことを確かめる。戻した後は _make-honban.sh → 検品 → 社長の ! で配置。
import fs from 'node:fs';
const f = new URL('../index.html', import.meta.url);
const s = fs.readFileSync(f, 'utf8');
const lines = s.split('\n');
const i = lines.findIndex(l => l.includes('<!-- JRAP-LINK-OFF'));
const j = lines.findIndex(l => l.includes('JRAP-LINK-OFF -->'));
if (i < 0 || j < 0 || j - i !== 4 || !lines[i + 1].includes('開始')) { console.error('中止: 目印が見つからない（もう戻してある？）'); process.exit(1); }
lines.splice(j, 1); lines.splice(i, 2);
fs.writeFileSync(f, lines.join('\n'));
console.log('戻した: index.html の説明文とボタン（' + (i + 1) + '行目から）');
