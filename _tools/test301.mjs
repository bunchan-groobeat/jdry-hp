// 301表（.htaccess の RewriteRule）に旧URLを当てて、未カバーを洗う（読み取りのみ）
import fs from 'node:fs';
const [, , htPath, urlPath] = process.argv;
const ht = fs.readFileSync(htPath, 'utf8').split(/\r?\n/);
const rules = [];
let cond=false;
for (const l of ht) {
  if (/^s*RewriteCond/.test(l)) { cond=true; continue; }
  const m = l.match(/^\s*RewriteRule\s+(\S+)\s+(\S+)\s+\[([^\]]*)\]/);
  if (m) { if (!cond) rules.push({ re: new RegExp(m[1]), to: m[2], flags: m[3] }); cond=false; }
}
const urls = fs.readFileSync(urlPath, 'utf8').split(/\r?\n/).filter(Boolean);
const newFiles = new Set(['', 'index.html', 'menu.html', 'food-truck.html', 'topics.html', 'contact.html', 'sitemap.xml', 'robots.txt', 'llms.txt']);
let miss = 0;
for (const u of urls) {
  const p = u.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '');
  const hit = rules.find(r => r.re.test(p));
  if (hit) console.log(`301  /${p}  ->  ${hit.to}`);
  else if (newFiles.has(p)) console.log(`200  /${p}  (新サイトに実在)`);
  else { console.log(`🔴未カバー  /${p}`); miss++; }
}
console.log(`\nルール ${rules.length} 本 ／ URL ${urls.length} 件 ／ 未カバー ${miss} 件`);
