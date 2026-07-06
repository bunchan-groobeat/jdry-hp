/* =========================================================
   J-DRY 静的サイト  共通スクリプト
   - トップのメインスライダー
   - Instagram フィード（Behold.so 等の無料サービス接続ポイント）
   - ページ上部へ戻る
========================================================= */
(function () {
  'use strict';

  /* ---------- メインスライダー ----------
     PC用(#top_slider)とスマホ用(#sp_slider・本物のsp_mainvisual準拠)の
     2つのスライダーを同じ仕組みで初期化する。表示切替はCSSメディアクエリ側で行う。 */
  function initSlider(slider) {
    if (!slider) return;
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.slide'));
    var dotsWrap = slider.querySelector('.slider_dots'); // スマホ用はドットなし（本物同様）
    if (slides.length === 0) return;

    var idx = 0;
    var timer = null;
    var INTERVAL = 5000;

    // ドット生成（ドット領域がある場合のみ）
    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = i + 1;
        b.addEventListener('click', function () { go(i); restart(); });
        dotsWrap.appendChild(b);
      });
      dots = Array.prototype.slice.call(dotsWrap.children);
    }

    function go(n) {
      slides[idx].classList.remove('is-active');
      if (dots[idx]) dots[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      if (dots[idx]) dots[idx].classList.add('is-active');
    }
    function next() { go(idx + 1); }
    function restart() { if (timer) clearInterval(timer); timer = setInterval(next, INTERVAL); }

    slides[0].classList.add('is-active');
    if (dots[0]) dots[0].classList.add('is-active');
    if (slides.length > 1) restart();
  }

  /* ---------- Instagram フィード ----------
     修復方針: 静的サイトでは WordPress プラグインが使えないため、
     Behold.so 等の無料フィードサービスが返す JSON を読み込んで描画する。
     ・Behold.so で @jdry.food を連携し、発行される Feed ID を BEHOLD_FEED_ID に設定する。
       → https://behold.so/  （無料枠あり・APIキー管理不要・自動更新）
     ・Feed ID 未設定の間はプレースホルダーのままにする。
  ------------------------------------------------------------ */
  var BEHOLD_FEED_ID = ''; // 例: 'abcd1234EFGh' （J-DRYさんが連携後に設定）
  var INSTA_MAX = 6;

  function initInstagram() {
    var feed = document.querySelector('.insta_feed');
    if (!feed) return;
    if (!BEHOLD_FEED_ID) return; // 未接続: プレースホルダー表示のまま

    fetch('https://feeds.behold.so/' + BEHOLD_FEED_ID)
      .then(function (r) { if (!r.ok) throw new Error('feed ' + r.status); return r.json(); })
      .then(function (data) {
        var posts = (data && (data.posts || data)) || [];
        if (!posts.length) return;
        feed.innerHTML = '';
        posts.slice(0, INSTA_MAX).forEach(function (p) {
          var a = document.createElement('a');
          a.href = p.permalink || 'https://www.instagram.com/jdry.food/';
          a.target = '_blank';
          a.rel = 'noopener nofollow';
          var img = document.createElement('img');
          img.src = p.thumbnailUrl || p.mediaUrl || p.sizes && p.sizes.small && p.sizes.small.mediaUrl;
          img.alt = (p.caption || 'J-DRY Instagram').slice(0, 60);
          img.loading = 'lazy';
          a.appendChild(img);
          feed.appendChild(a);
        });
      })
      .catch(function (e) { /* 失敗時はプレースホルダーのまま */ console.warn('Instagram feed:', e); });
  }

  /* ---------- ライトボックス（商品画像の拡大＋ギャラリー送り） ----------
     現サイト(imagelightbox)と同様の挙動:
     ・サムネイルをクリック → 暗い半透明オーバーレイ上に拡大表示
     ・拡大中に画像をクリック → 次の画像へスライド遷移（末尾で先頭へループ）
     ・閉じるのは Esc キー または 画像の外側（背景）クリック
  ------------------------------------------------------------ */
  function initLightbox() {
    var links = document.querySelectorAll('a.thumb[href$=".jpg"], a.thumb[href$=".png"], a.thumb[href$=".jpeg"]');
    if (!links.length) return;

    // ギャラリー（DOM順）を配列化
    var gallery = Array.prototype.map.call(links, function (a) {
      var t = a.querySelector('img');
      return { href: a.getAttribute('href'), alt: t ? t.alt : '' };
    });

    var overlay = document.createElement('div');
    overlay.className = 'lightbox_overlay';
    overlay.innerHTML = '<img alt="">';
    document.body.appendChild(overlay);
    var bigImg = overlay.querySelector('img');

    // ローディング表示（imagelightbox標準）
    var loading = document.createElement('div');
    loading.className = 'lb_loading';
    loading.innerHTML = '<div></div>';
    document.body.appendChild(loading);

    // キャプション（商品名の帯）
    var caption = document.createElement('div');
    caption.className = 'lb_caption';
    document.body.appendChild(caption);

    var current = -1;
    var animating = false;
    // 本物(imagelightbox)のタイミングに準拠
    var ENTER = 350;          // 入場: animationSpeed(250) + 100 の調整遅延ぶんをふまえた体感時間
    var EXIT = 250;           // 退場: animationSpeed
    var SLIDE = 100;          // スライド距離(px): 本物の 100*t オフセット
    var START_DELAY = 50;     // 本物の setTimeout(...,50) 相当の始動遅延
    var SWING = 'ease-in-out';// jQuery の swing 相当のイージング

    function showLoading() { loading.style.display = 'block'; }
    function hideLoading() { loading.style.display = 'none'; }
    // 本物のフロー: 読み込み開始でキャプション非表示 → 完了で商品名を表示
    function showCaption(text) {
      caption.textContent = text || '';
      caption.style.display = text ? 'block' : 'none';
    }
    function hideCaption() { caption.style.display = 'none'; }

    // 画像を先読みし、読み込み完了後にコールバック（読み込み中はローディング表示・キャプション非表示）
    function preload(src, cb) {
      showLoading();
      hideCaption();
      var pre = new Image();
      pre.onload = pre.onerror = function () { hideLoading(); cb(); };
      pre.src = src;
    }

    // 右(+SLIDE)から中央へ、フェードしながらゆったりスライドインさせる
    function enterFrom(offset) {
      bigImg.style.transition = 'none';
      bigImg.style.transform = 'translateX(' + offset + 'px)';
      bigImg.style.opacity = '0';
      void bigImg.offsetWidth; // 開始状態を確定
      setTimeout(function () {
        bigImg.style.transition = 'transform ' + ENTER + 'ms ' + SWING + ', opacity ' + ENTER + 'ms ' + SWING;
        bigImg.style.transform = 'translateX(0)';
        bigImg.style.opacity = '1';
      }, START_DELAY);
    }

    function open(i) {
      overlay.classList.add('is-open');
      current = i;
      bigImg.style.transition = 'none';
      bigImg.style.opacity = '0';
      preload(gallery[i].href, function () {
        bigImg.src = gallery[i].href;
        bigImg.alt = gallery[i].alt;
        enterFrom(SLIDE); // 読み込み完了後にふわっとフェード＆スライドイン
        showCaption(gallery[i].alt); // 商品名の帯を表示
      });
    }

    // 次の画像へスライド遷移（読み込み中はローディング表示）
    function slideNext() {
      if (animating || gallery.length < 2) return;
      animating = true;
      var nextIndex = (current + 1) % gallery.length; // 末尾→先頭ループ
      // 現在の画像を左へフェード＆スライドアウト
      bigImg.style.transition = 'transform ' + EXIT + 'ms ' + SWING + ', opacity ' + EXIT + 'ms ' + SWING;
      bigImg.style.transform = 'translateX(-' + SLIDE + 'px)';
      bigImg.style.opacity = '0';
      setTimeout(function () {
        current = nextIndex;
        preload(gallery[nextIndex].href, function () {
          bigImg.src = gallery[nextIndex].href;
          bigImg.alt = gallery[nextIndex].alt;
          enterFrom(SLIDE); // 次の画像を右からゆったり入場
          showCaption(gallery[nextIndex].alt); // 商品名を切り替え
          setTimeout(function () { animating = false; }, ENTER + START_DELAY);
        });
      }, EXIT);
    }

    function close() {
      overlay.classList.remove('is-open');
      hideLoading();
      hideCaption();
      bigImg.src = '';
      current = -1;
      animating = false;
    }

    // サムネイルクリックで開く
    Array.prototype.forEach.call(links, function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        open(i);
      });
    });

    // 拡大画像クリック → 次へ（閉じない）
    bigImg.addEventListener('click', function (e) {
      e.stopPropagation();
      slideNext();
    });
    // 背景（画像の外側）クリック → 閉じる
    overlay.addEventListener('click', close);
    // Escキー → 閉じる
    document.addEventListener('keydown', function (e) {
      if (overlay.classList.contains('is-open') && (e.key === 'Escape' || e.keyCode === 27)) close();
    });
  }

  /* ---------- お問い合わせフォーム（Formspree 非同期送信） ---------- */
  function initContactForm() {
    var form = document.querySelector('.contact_form');
    if (!form) return;
    var status = form.querySelector('.form_status');
    var button = form.querySelector('button[type=submit]');

    function showStatus(msg, type) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form_status is-' + type;
      status.hidden = false;
    }

    // エンドポイント未設定（YOUR_FORM_ID のまま）なら送信させず案内表示
    var configured = form.action.indexOf('YOUR_FORM_ID') === -1 &&
                     /formspree\.io\/f\//.test(form.action);

    form.addEventListener('submit', function (e) {
      if (!configured) {
        e.preventDefault();
        showStatus('送信先が未設定です。管理者にご連絡ください。', 'error');
        return;
      }
      // fetch 非対応ブラウザは通常POSTにフォールバック（既定動作を妨げない）
      if (!window.fetch) return;

      e.preventDefault();
      button.disabled = true;
      showStatus('送信中です…', 'pending');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          showStatus('お問い合わせを送信しました。ご返信まで少々お待ちください。', 'success');
        } else {
          return res.json().then(function (data) {
            var msg = (data && data.errors && data.errors.length)
              ? data.errors.map(function (x) { return x.message; }).join(' / ')
              : '送信に失敗しました。時間をおいて再度お試しください。';
            showStatus(msg, 'error');
          });
        }
      }).catch(function () {
        showStatus('通信エラーが発生しました。時間をおいて再度お試しください。', 'error');
      }).then(function () {
        button.disabled = false;
      });
    });
  }

  /* ---------- ページ上部へ戻る ---------- */
  function initReturnTop() {
    var btn = document.getElementById('return_top');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSlider(document.getElementById('top_slider'));
    initSlider(document.getElementById('sp_slider'));
    initInstagram();
    initLightbox();
    initContactForm();
    initReturnTop();
  });
})();
