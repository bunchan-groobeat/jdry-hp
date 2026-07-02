# J-DRY ホームページ（静的サイト再構築版）

現行サイト <https://j-dry.com/>（WordPress + TCDテーマ `sweety_tcd029` 製）の見た目を、
依存ライブラリなしの静的サイト（HTML / CSS / JavaScript）として再現したものです。

## 目的（やること3点）

1. 現サイトの見た目をそのまま再現（デザイン・構成・掲載内容は変えない）
2. 新商品「ドライフルーツジュース」をメニューに追加
3. Instagram連携の修復（アカウント: [@jdry.food](https://www.instagram.com/jdry.food/)）

## ページ構成

| ファイル | ページ | 備考 |
|----------|--------|------|
| `index.html` | HOME | メインビジュアル / ブランドメッセージ / 商品一覧 / こだわり / Topics / Instagram |
| `menu.html` | FOOD/DRINK MENU | 6カテゴリー＋新商品「ドライフルーツジュース」 |
| `food-truck.html` | FOOD TRUCK | 今回新規作成（仮素材。文章・写真は後日J-DRYより提供予定） |
| `topics.html` | TOPICS | お知らせ一覧 |
| `contact.html` | CONTACT | お問い合わせフォーム |
| WEBSTORE | 外部リンク | <https://jdryfood8989.base.shop/>（BASEストア） |

## デザイントークン（現サイト準拠）

- 本文色: `#333333` / アクセント色: `#FF5500` / セクション背景ベージュ: `#e6e3dc`
- 本文フォント: Arial, sans-serif ／ 見出し: 明朝系（Garamond, 游明朝 …）
- コンテンツ幅: 1160px（レスポンシブ対応を追加）

## Instagram連携について

現サイトはWordPressプラグイン（Smash Balloon）でフィード表示していたが画像が表示されない状態。
静的サイトでは無料フィードサービス（Behold.so 等）を利用して修復する方針。
`assets/js/main.js` の `initInstagram()` に接続ポイントを用意しています。
未接続の間はプレースホルダーを表示します。

## ローカル確認

このディレクトリを簡易HTTPサーバーで開くだけで確認できます。

```bash
# 例
npx serve .
# または Python
python -m http.server 8000
```

## TODO（素材提供待ち）

- [ ] 新商品「ドライフルーツジュース」の商品画像・説明文・カテゴリー内訳
- [ ] FOOD TRUCK ページの本文・写真素材
- [ ] Behold.so 等のフィードUUID / エンドポイント（Instagram連携の本接続）
