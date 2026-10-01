#!/bin/sh
# J-DRY：入れ替え本番用の一式を組み立てる — 2026-10-01 判定役（水野谷 make-honban.sh の型）
#   ★ファイル名の先頭が _ なのは、GitHub Pages（制作版）に配信させないため（Jekyll は _ 始まりを出さない）。
#   使い方:  sh C:/HQ/projects/jdry-hp-src/_make-honban.sh
#            受信先メールを社長が確認した後だけ:  FORM_TO_CONFIRMED=1 sh C:/HQ/projects/jdry-hp-src/_make-honban.sh
#   出力先:  C:/HQ_deploy/jdry-honban（毎回まるごと作り直す）
#
# ★このスクリプトは「手元に本番用の中身を作るだけ」。サーバー・DNS・GitHub には一切触らない。
# ★制作版（このフォルダ＝github.io/jdry-hp の中身）は書き換えない。noindex＋github.io のURLのまま置いておく。
#
#   ① 追跡ファイルだけを複製（_ で始まるもの・.md・.gitignore は持ち込まない）
#   ② 絶対URLを最終ドメインへ（canonical・og:url・og:image・JSON-LD・sitemap）
#   ③ noindex を外す／フォームを自前 send.php へ／llms.txt の社内メモを落とす（_tools/honban-patch.mjs）
#   ④ コメント剥がし（社内メモ「社長指示」等が HTML/CSS/JS に約200件ある）
#   ⑤ robots.txt・.htaccess（301＋正規化＋フォーム保護）・send.php・form-config.php を入れる
#   ⑥ sitemap.xml を作り直す（lastmod＝実行日）
#   ⑦ 点検（禁止語・旧URL・混入ファイル・フォーム）

set -e
SRC=C:/HQ/projects/jdry-hp-src
DST=C:/HQ_deploy/jdry-honban
BASE=https://j-dry.com
OLDBASE=https://bunchan-groobeat.github.io/jdry-hp
SHARED=C:/HQ/projects/_shared
STRIP=C:/HQ/projects/mizunoya-v2-deploy/tools/strip-comments.mjs
FORM=C:/HQ/templates/form-php
TODAY=$(date +%Y-%m-%d)

echo "=== ① 複製（git 追跡ファイルのみ）$SRC -> $DST"
rm -rf "$DST"; mkdir -p "$DST"
git -C "$SRC" -c core.quotepath=off ls-files | grep -v -E '(^|/)_|\.md$|^\.gitignore$' | while read -r f; do
  mkdir -p "$DST/$(dirname "$f")"; cp "$SRC/$f" "$DST/$f"
done
find "$DST" \( -name "*.bak*" -o -name "*.orig" \) -type f -delete

echo "=== ② 絶対URLを最終ドメインへ"
sh "$SHARED/set-site-url.sh" "$DST" "$OLDBASE" "$BASE" --commit | sed 's/^/    /'
# （控え C:/HQ_deploy/_backup_<日時>.tar.gz が1つ増える。他案件の控えと同じ場所なので、ここでは消さない）

echo "=== ③ noindex・フォーム・llms.txt"
node "$SRC/_tools/honban-patch.mjs" "$DST"

echo "=== ④ コメント剥がし"
node "$STRIP" "$DST" | sed 's/^/    /'

echo "=== ⑤ robots / .htaccess / フォーム"
# 社内向けの注記（「社長判断」等）が # 行にあるので、# 行を落として置く（ロボットの指定は変えない）
grep -v "^#" "$SRC/_robots_本番用.txt" | cat -s > "$DST/robots.txt"
cp "$SRC/_301_本番用.htaccess.txt" "$DST/.htaccess"
cp "$FORM/send.php" "$DST/send.php"
cp "$SRC/_form-config_本番用.php" "$DST/form-config.php"

echo "=== ⑥ sitemap.xml（lastmod=$TODAY）"
sh "$SHARED/make-sitemap.sh" "$DST" "$BASE" "$TODAY" | sed 's/^/    /'

echo "=== ⑦ 点検"
NG=0
for w in "noindex" "STAGING" "github.io" "bunchan-groobeat" "YOUR_FORM_ID" "formspree.io/f/"; do
  N=$(grep -rl "$w" "$DST" --include="*.html" 2>/dev/null | grep -c . || true)
  printf "    %-20s %s ファイル\n" "$w" "$N"; [ "$N" -gt 0 ] && NG=1
done
N=$(grep -rl "$OLDBASE" "$DST" 2>/dev/null | grep -c . || true); printf "    %-20s %s ファイル\n" "旧URL(全種)" "$N"; [ "$N" -gt 0 ] && NG=1
# 客に見えてはいけない語（★差し替えを足したら、ここにも語を足す＝honban-build-anzenben）
for w in "社長" "太郎" "ジロー" "ご確認用" "確認用" "デモ" "提案用" "仮素材" "後日" "要確認" "未確定" "店主様の確認" "検索には出ない"; do
  N=$(grep -rl "$w" "$DST" --include="*.html" --include="*.css" --include="*.js" --include="*.txt" --include="*.xml" 2>/dev/null | grep -c . || true)
  [ "$N" -gt 0 ] && { echo "    🔴 客に見える内部文言「$w」: $N ファイル $(grep -rl "$w" "$DST" --include="*.html" --include="*.css" --include="*.js" --include="*.txt" --include="*.xml" | sed "s|$DST/||" | tr '\n' ' ')"; NG=1; }
done
# 乗っ取られた旧インスタ（@jdry.food・2025年に乗っ取り被害）への導線
N=$(grep -rhoE "instagram\.com/jdry\.food([^0-9]|$)|@jdry\.food([^0-9]|$)" "$DST" 2>/dev/null | grep -c . || true)
printf "    %-20s %s 箇所\n" "旧インスタ jdry.food" "$N"; [ "$N" -gt 0 ] && NG=1
# 「準備中」は Instagram 枠の初期表示（JS で写真に置き換わる）。数だけ出す（🟡）
printf "    %-20s %s 箇所（🟡 JSが止まると見える）\n" "準備中" "$(grep -rho "準備中" "$DST" --include="*.html" | grep -c . || true)"
for f in .md KENPIN README _line _301 _robots _form-config .bak; do
  N=$(find "$DST" -name "*$f*" | grep -c . || true)
  [ "$N" -gt 0 ] && { echo "    🔴 混入: $f が $N 件"; NG=1; }
done
grep -q 'action="send.php"' "$DST/contact.html" && echo "    フォーム送信先        send.php" || { echo "    🔴 フォーム送信先が send.php でない"; NG=1; }
if [ "$FORM_TO_CONFIRMED" != "1" ]; then
  echo "    🔴 フォーム受信先（$(grep -o "'to' *=> *'[^']*'" "$DST/form-config.php")）は社長確認待ち。確認後に FORM_TO_CONFIRMED=1 を付けて流し直す"
  NG=1
fi
echo "    ファイル数 : $(find "$DST" -type f | wc -l) / $(du -sh "$DST" | cut -f1)"

echo
echo "=== 次にやること"
echo "  検品:  node C:/HQ/kenpin/tools/static-check.mjs \"$DST\" published"
if [ "$NG" = 1 ]; then
  echo "  🔴 上の点検で引っかかりあり。直すまで本番へ出さない。"
else
  echo "  🟢 点検は通過（検品と secret-scan は別に流す）。"
fi
