/* =========================================================
   J-DRY Topics（お知らせ）— microCMS クライアントサイド読み込み
   ---------------------------------------------------------
   方式: ビルドなしの静的サイトのまま、ブラウザから microCMS の
         コンテンツAPIを直接 fetch して記事一覧を描画する。
         → 記事を「公開」すると再ビルド不要で即時反映される。

   接続情報は assets/js/config.js（window.JDRY_CONFIG）に分離。
   未設定の間は、HTMLに元から書いてある静的なお知らせをそのまま残す
   （＝キー到着前でもページは成立する）。

   セキュリティ: config.js の APIキーは必ず「読み取り専用（GET）」を使用。
   本スクリプトは GET（取得）しか行わない。
========================================================= */
(function () {
  'use strict';

  var cfg = window.JDRY_CONFIG || {};
  var listEl = document.getElementById('archive_post_list');
  if (!listEl) return;

  // 接続情報が未設定なら何もしない（HTMLの静的お知らせを表示したまま）
  var configured = cfg.MICROCMS_SERVICE_DOMAIN && cfg.MICROCMS_API_KEY;
  if (!configured) {
    // 開発者向けのヒント（画面には出さない）
    if (window.console) {
      console.info('[Topics] microCMS 未接続のため静的お知らせを表示中。' +
        'assets/js/config.js にサービスドメインと読み取り専用APIキーを設定すると自動取得に切り替わります。');
    }
    return;
  }

  var endpoint = cfg.MICROCMS_ENDPOINT || 'topics';
  var limit = cfg.TOPICS_LIMIT || 20;
  // 公開日(publishedDate)の降順。未設定記事に備え publishedAt でも並ぶよう二段構え。
  var url = 'https://' + cfg.MICROCMS_SERVICE_DOMAIN + '.microcms.io/api/v1/' + endpoint +
            '?limit=' + encodeURIComponent(limit) + '&orders=-publishedDate';

  // ---- 各種表示ヘルパー ----
  function setMessage(html) {
    listEl.innerHTML = '<li class="topics_state">' + html + '</li>';
  }

  function showLoading() {
    setMessage('読み込み中です…');
  }

  function showEmpty() {
    setMessage('現在お知らせはありません。');
  }

  function showError() {
    // エラー時は既存の静的お知らせを壊さないため、listEl は書き換えない。
    if (window.console) console.warn('[Topics] microCMS の取得に失敗しました。静的お知らせを表示します。');
  }

  // 日付を 2021.11.4 形式へ（microCMSは ISO文字列 or YYYY-MM-DD を返す）
  function formatDate(v) {
    if (!v) return '';
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate();
  }

  // リッチエディタ本文(HTML)からタグを除いた抜粋を作る
  function makeExcerpt(item) {
    if (item.excerpt) return item.excerpt;
    var src = item.body || '';
    var tmp = document.createElement('div');
    tmp.innerHTML = src;
    var text = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    if (text.length > 90) text = text.slice(0, 90) + '…';
    return text;
  }

  // microCMSの画像は ?w= 等のクエリでリサイズ配信できる
  function thumbUrl(item, w, h) {
    if (!item.thumbnail || !item.thumbnail.url) return '';
    return item.thumbnail.url + '?fit=crop&w=' + w + '&h=' + h;
  }

  // HTMLエスケープ（タイトル・カテゴリ等のテキスト用）
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // 1記事ぶんの <li>（既存の #archive_post_list のマークアップ・デザインを踏襲）
  function renderItem(item) {
    var li = document.createElement('li');
    var date = formatDate(item.publishedDate || item.publishedAt);
    var category = item.category || 'お知らせ';
    var title = esc(item.title || '(無題)');
    var excerpt = esc(makeExcerpt(item));
    var thumb = thumbUrl(item, 355, 210);

    var imageHtml = thumb
      ? '<span class="image"><img src="' + thumb + '" alt="' + title + '" loading="lazy"></span>'
      : '';

    li.innerHTML =
      imageHtml +
      '<div class="right_content">' +
        '<h2 class="title">' + title + '</h2>' +
        '<p class="meta"><span class="date">' + esc(date) + '</span><span class="cat">' + esc(category) + '</span></p>' +
        '<p class="excerpt">' + excerpt + '</p>' +
      '</div>';
    return li;
  }

  // ---- 取得して描画 ----
  showLoading();

  fetch(url, { headers: { 'X-MICROCMS-API-KEY': cfg.MICROCMS_API_KEY } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var items = (data && data.contents) || [];
      if (!items.length) { showEmpty(); return; }
      listEl.innerHTML = '';
      items.forEach(function (item) {
        listEl.appendChild(renderItem(item));
      });
    })
    .catch(function (e) {
      if (window.console) console.warn('[Topics] fetch error:', e);
      showError();
    });
})();
