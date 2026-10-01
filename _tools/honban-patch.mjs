// J-DRY 本番セットの書き換え（make-honban.sh から呼ぶ）— 2026-10-01 判定役
//   使い方: node honban-patch.mjs <本番セットのフォルダ>
//   ★本番セット（C:/HQ_deploy/jdry-honban）にだけ掛ける。制作版の元ファイルは触らない。
//   やること: ① noindex メタの行を消す ② フォームの送信先を自前 send.php へ ③ main.js の「設定済み」判定に send.php を足す
//             ④ llms.txt の社内メモ（# ★未確定 以降）を落とす
import fs from 'node:fs';
import path from 'node:path';

const D = process.argv[2];
if (!D || !fs.existsSync(D)) { console.error('使い方: node honban-patch.mjs <フォルダ>'); process.exit(1); }
let ng = 0;
const rd = f => fs.readFileSync(path.join(D, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(D, f), s);

// ① noindex（目印つき・素のものの両方）
for (const f of fs.readdirSync(D).filter(f => f.endsWith('.html'))) {
  const s = rd(f);
  const t = s.split('\n').filter(l => !/<meta\s+name="robots"\s+content="noindex/i.test(l)).join('\n');
  if (t !== s) { wr(f, t); console.log(`  noindex 削除: ${f}`); }
}

// ② contact.html の action
{
  const f = 'contact.html', s = rd(f);
  const t = s.replace('action="https://formspree.io/f/YOUR_FORM_ID"', 'action="send.php"');
  if (t === s) { console.log('  🔴 contact.html の action を差し替えられなかった'); ng = 1; } else { wr(f, t); console.log('  フォーム送信先: send.php'); }
}

// ③ main.js の判定（templates/form-php/README.md の指示どおり）
{
  const f = 'assets/js/main.js', s = rd(f);
  const before = "/formspree\\.io\\/f\\//.test(form.action)";
  const after = "/(formspree\\.io\\/f\\/|send\\.php$)/.test(form.action)";
  if (!s.includes(before)) { console.log('  🔴 main.js の判定行が見つからない'); ng = 1; }
  else { wr(f, s.replace(before, after)); console.log('  main.js: send.php を「設定済み」と判定するよう変更'); }
}

// ④ llms.txt の社内メモ
{
  const f = 'llms.txt', s = rd(f);
  const i = s.indexOf('# ★未確定');
  if (i >= 0) { wr(f, s.slice(0, i).replace(/\s+$/, '') + '\n'); console.log('  llms.txt: 社内メモ（# ★未確定 以降）を削除'); }
}
process.exit(ng);
