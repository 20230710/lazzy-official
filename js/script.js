// =========================================================
// Lazzy 公式サイト用スクリプト
// ・スクロール時（TOPページ）／常時（下層ページ）のハンバーガー表示切り替え
// ・フルスクリーンメニューの開閉
// =========================================================

document.addEventListener('DOMContentLoaded', function () {
  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var menuOverlay = document.getElementById('menuOverlay');

  // ---- スクロールしたらヘッダーをコンパクト表示（TOPページのみ） ----
  // 下層ページ（guideline.html等）は header-compact-always クラスが
  // 最初から付いているため、この処理は不要
  if (header && !header.classList.contains('header-compact-always')) {
    var COMPACT_THRESHOLD = 80;
    var onScroll = function () {
      if (window.scrollY > COMPACT_THRESHOLD) {
        header.classList.add('is-compact');
      } else {
        header.classList.remove('is-compact');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- フルスクリーンメニューの開閉（ハンバーガー1つで開閉を兼用） ----
  if (navToggle && menuOverlay) {
    var openMenu = function () {
      menuOverlay.classList.add('is-open');
      navToggle.classList.add('is-active');
      document.body.classList.add('menu-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'メニューを閉じる');
    };
    var closeMenu = function () {
      menuOverlay.classList.remove('is-open');
      navToggle.classList.remove('is-active');
      document.body.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'メニューを開く');
    };

    navToggle.addEventListener('click', function () {
      if (menuOverlay.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menuOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // ---- 見出しやコンテンツがスクロールで見えたらフェードイン ----
  var revealTargets = document.querySelectorAll('.section-title, .reveal, .reveal-stagger');
  if (revealTargets.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    revealTargets.forEach(function (target) {
      revealObserver.observe(target);
    });
  } else {
    revealTargets.forEach(function (target) {
      target.classList.add('is-visible');
    });
  }
});

// ---- ページローダー：最低3秒は表示し、読み込み完了後に非表示（TOPページのみ） ----
// ローダーが消えるタイミングでヒーローの登場アニメーションを開始する
window.addEventListener('load', function () {
  var loader = document.getElementById('pageLoader');
  if (!loader) return;
  var MIN_DISPLAY_MS = 2000;
  var remaining = MIN_DISPLAY_MS - performance.now();
  setTimeout(function () {
    loader.classList.add('is-hidden');
    document.body.classList.add('content-revealed');
  }, Math.max(0, remaining));
});
