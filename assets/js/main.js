/* =========================================================
   J-DRY 静的サイト  共通スクリプト
   - トップのメインスライダー
   - Instagram フィード（Behold.so 等の無料サービス接続ポイント）
   - ページ上部へ戻る
========================================================= */
(function () {
  'use strict';

  /* ---------- メインスライダー ---------- */
  function initSlider() {
    var slider = document.getElementById('top_slider');
    if (!slider) return;
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.slide'));
    var dotsWrap = slider.querySelector('.slider_dots');
    if (slides.length === 0) return;

    var idx = 0;
    var timer = null;
    var INTERVAL = 5000;

    // ドット生成
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = i + 1;
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function go(n) {
      slides[idx].classList.remove('is-active');
      dots[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      dots[idx].classList.add('is-active');
    }
    function next() { go(idx + 1); }
    function restart() { if (timer) clearInterval(timer); timer = setInterval(next, INTERVAL); }

    slides[0].classList.add('is-active');
    dots[0].classList.add('is-active');
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

    var current = -1;
    var animating = false;
    var DURATION = 250; // ms

    // 画像を即時セット（初回表示用）
    function setImmediate(i) {
      current = i;
      bigImg.style.transition = 'none';
      bigImg.style.transform = 'translateX(0)';
      bigImg.style.opacity = '1';
      bigImg.src = gallery[i].href;
      bigImg.alt = gallery[i].alt;
    }

    // 次の画像へスライド遷移
    function slideNext() {
      if (animating || gallery.length < 2) return;
      animating = true;
      var nextIndex = (current + 1) % gallery.length; // 末尾→先頭ループ
      // 現在の画像を左へスライドアウト
      bigImg.style.transition = 'transform ' + DURATION + 'ms ease, opacity ' + DURATION + 'ms ease';
      bigImg.style.transform = 'translateX(-40px)';
      bigImg.style.opacity = '0';
      setTimeout(function () {
        // 新しい画像を右側にセットしてからスライドイン
        current = nextIndex;
        bigImg.src = gallery[nextIndex].href;
        bigImg.alt = gallery[nextIndex].alt;
        bigImg.style.transition = 'none';
        bigImg.style.transform = 'translateX(40px)';
        bigImg.style.opacity = '0';
        void bigImg.offsetWidth; // リフローを強制
        bigImg.style.transition = 'transform ' + DURATION + 'ms ease, opacity ' + DURATION + 'ms ease';
        bigImg.style.transform = 'translateX(0)';
        bigImg.style.opacity = '1';
        setTimeout(function () { animating = false; }, DURATION);
      }, DURATION);
    }

    function open(i) {
      setImmediate(i);
      overlay.classList.add('is-open');
    }
    function close() {
      overlay.classList.remove('is-open');
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
    initSlider();
    initInstagram();
    initLightbox();
    initReturnTop();
  });
})();
