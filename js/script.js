// =========================================================
// Lazzy 公式サイト用スクリプト
// ・スクロール時（TOPページ）／常時（下層ページ）のハンバーガー表示切り替え
// ・フルスクリーンメニューの開閉
// ・WORKSの選択中表示、MUSICの絞り込み・横スクロール
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

  // ---- フッターの「To TOP」ボタン ----
  var scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- WORKS：画面の真ん中に一番近い項目を大きく表示し、左の画像を切り替える ----
  var worksList = document.getElementById('worksList');
  if (worksList) {
    var worksItems = worksList.querySelectorAll('.works-item');
    var worksImg = document.querySelector('.works-visual-img');
    var worksPlaceholder = document.querySelector('.works-visual-placeholder');
    var activeWorksItem = null;

    var setActiveWorksItem = function (item) {
      if (item === activeWorksItem) return;
      if (activeWorksItem) activeWorksItem.classList.remove('is-active');
      item.classList.add('is-active');
      activeWorksItem = item;

      var src = item.getAttribute('data-image');
      if (src) {
        worksImg.src = src;
        worksImg.alt = item.querySelector('p').textContent;
        worksImg.hidden = false;
        worksPlaceholder.hidden = true;
      } else {
        worksImg.hidden = true;
        worksPlaceholder.hidden = false;
      }
    };

    var worksTicking = false;
    var updateWorks = function () {
      worksTicking = false;
      var center = window.innerHeight / 2;
      var closest = worksItems[0];
      var closestDistance = Infinity;
      worksItems.forEach(function (item) {
        var rect = item.getBoundingClientRect();
        var distance = Math.abs(rect.top + rect.height / 2 - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = item;
        }
      });
      setActiveWorksItem(closest);
    };
    window.addEventListener('scroll', function () {
      if (!worksTicking) {
        worksTicking = true;
        requestAnimationFrame(updateWorks);
      }
    }, { passive: true });
    window.addEventListener('resize', updateWorks);
    updateWorks();

    // 項目をクリックしたら、その項目が画面の真ん中に来るようにスクロール
    worksItems.forEach(function (item) {
      item.addEventListener('click', function () {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  // ---- MUSIC：絞り込みボタン ----
  var musicFilter = document.querySelector('.music-filter');
  if (musicFilter) {
    var musicCards = document.querySelectorAll('.music-card');
    musicFilter.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');
        musicFilter.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('is-active', b === button);
          b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
        });
        musicCards.forEach(function (card) {
          card.hidden = filter !== 'all' && card.getAttribute('data-artist') !== filter;
        });
      });
    });
  }

  // ---- MUSIC：カードの列をマウスでドラッグして横に動かせるようにする ----
  var musicCarousel = document.querySelector('.music-carousel');
  if (musicCarousel) {
    var dragStartX = 0;
    var dragStartScroll = 0;
    var dragMoved = false;
    var isPointerDown = false;

    musicCarousel.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      isPointerDown = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartScroll = musicCarousel.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!isPointerDown) return;
      var dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 5) {
        dragMoved = true;
        musicCarousel.classList.add('is-dragging');
      }
      if (dragMoved) musicCarousel.scrollLeft = dragStartScroll - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!isPointerDown) return;
      isPointerDown = false;
      musicCarousel.classList.remove('is-dragging');
    });
    // ドラッグした直後のクリックではリンクを開かない
    musicCarousel.addEventListener('click', function (e) {
      if (dragMoved) {
        e.preventDefault();
        dragMoved = false;
      }
    }, true);
  }
});

// ---- ページローダー：最低2秒は表示し、読み込み完了後に非表示（TOPページのみ） ----
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
