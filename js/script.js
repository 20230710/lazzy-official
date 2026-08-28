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
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'メニューを閉じる');
    };
    var closeMenu = function () {
      menuOverlay.classList.remove('is-open');
      navToggle.classList.remove('is-active');
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
});
