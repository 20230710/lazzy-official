// =========================================================
// Lazzy 公式サイト用スクリプト
// ・スクロール時（TOPページ）／常時（下層ページ）のハンバーガー表示切り替え
// ・フルスクリーンメニューの開閉
// =========================================================

document.addEventListener('DOMContentLoaded', function () {
  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuOverlayClose = document.getElementById('menuOverlayClose');

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

  // ---- フルスクリーンメニューの開閉 ----
  if (navToggle && menuOverlay) {
    var openMenu = function () {
      menuOverlay.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
    };
    var closeMenu = function () {
      menuOverlay.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', openMenu);
    if (menuOverlayClose) menuOverlayClose.addEventListener('click', closeMenu);

    menuOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }
});
