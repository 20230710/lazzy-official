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

  // ---- ヘッダーのロゴが明るい背景（アイボリーのセクション・MOVIEの白いパネル）に重なったら紺色に切り替え ----
  var headerLogo = header && header.querySelector('.logo-lockup');
  if (headerLogo) {
    var lightAreas = document.querySelectorAll('.section-ivory, .movie-panel');
    var logoTicking = false;
    var updateLogoColor = function () {
      logoTicking = false;
      var r = headerLogo.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      var onLight = false;
      lightAreas.forEach(function (area) {
        var b = area.getBoundingClientRect();
        if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) onLight = true;
      });
      header.classList.toggle('is-on-light', onLight);
    };
    var requestLogoUpdate = function () {
      if (!logoTicking) {
        logoTicking = true;
        requestAnimationFrame(updateLogoColor);
      }
    };
    window.addEventListener('scroll', requestLogoUpdate, { passive: true });
    window.addEventListener('resize', requestLogoUpdate);
    updateLogoColor();
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

  // ---- YouTube：クリックするまではサムネイル＋再生ボタンだけを表示し、クリックしたらその場で再生 ----
  // HTMLの data-url には watch?v= / youtu.be/ / shorts/ / embed/ のどの形のURLでも、動画IDだけでも書ける
  // （再生が始まった後のYouTubeの表示は隠さない。上に何かをかぶせて隠すのは規約違反のため）
  document.querySelectorAll('.yt').forEach(function (el) {
    var src = el.getAttribute('data-url') || el.getAttribute('data-id') || '';
    var match = src.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    var id = match ? match[1] : src.trim();
    var title = el.getAttribute('data-title') || '動画';
    if (!id) return;

    // サムネイルは高画質から順に試す（maxres 1280×720 → sd 640×480 → hq 480×360）。
    // その画質がない動画では、YouTubeは 120×90 の灰色の画像を返すので、それを見たら次に切り替える
    var thumbSizes = ['maxresdefault', 'sddefault', 'hqdefault'];
    var thumbIndex = 0;
    var thumb = document.createElement('img');
    var nextThumb = function () {
      if (thumbIndex < thumbSizes.length - 1) {
        thumbIndex++;
        thumb.src = 'https://i.ytimg.com/vi/' + id + '/' + thumbSizes[thumbIndex] + '.jpg';
      }
    };
    thumb.addEventListener('load', function () {
      if (thumb.naturalWidth <= 120) nextThumb();
    });
    thumb.addEventListener('error', nextThumb);
    thumb.src = 'https://i.ytimg.com/vi/' + id + '/' + thumbSizes[0] + '.jpg';
    thumb.alt = '';
    thumb.loading = 'lazy';

    // class="yt yt-lightbox" のときは再生せず、クリックでサムネイルを大きく表示する
    // （再生ボタンは出さず、枠そのものをボタンとして扱う。キーボードでも Enter / スペースで開ける）
    if (el.classList.contains('yt-lightbox')) {
      el.replaceChildren(thumb);
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', title + 'を拡大表示');
      el.addEventListener('click', function () {
        openLightbox(thumb.currentSrc || thumb.src, title, el);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(thumb.currentSrc || thumb.src, title, el);
        }
      });
      return;
    }

    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'yt-play';
    play.setAttribute('aria-label', title + 'を再生');
    el.replaceChildren(thumb, play);

    el.addEventListener('click', function () {
      var player = document.createElement('iframe');
      player.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      player.title = title;
      player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      player.allowFullscreen = true;
      el.replaceChildren(player);
      el.style.cursor = 'auto';
    }, { once: true });
  });

  // ---- サムネイルの拡大表示（初めて開くときに作る。×ボタン・背景のクリック・Escで閉じる） ----
  var lightbox = null;
  var lightboxImg = null;
  var lightboxClose = null;
  var lightboxReturnFocus = null;
  var closeLightbox = function () {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    if (lightboxReturnFocus) lightboxReturnFocus.focus();
  };
  function openLightbox(src, title, opener) {
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightboxImg = document.createElement('img');
      lightboxImg.className = 'lightbox-img';
      lightboxClose = document.createElement('button');
      lightboxClose.type = 'button';
      lightboxClose.className = 'lightbox-close';
      lightboxClose.setAttribute('aria-label', '閉じる');
      lightbox.append(lightboxImg, lightboxClose);
      document.body.appendChild(lightbox);
      lightbox.addEventListener('click', closeLightbox);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLightbox();
      });
    }
    lightboxImg.src = src;
    lightboxImg.alt = title;
    lightbox.setAttribute('aria-label', title);
    lightboxReturnFocus = opener;
    document.body.classList.add('lightbox-open');
    lightbox.classList.add('is-open');
    lightboxClose.focus();
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
