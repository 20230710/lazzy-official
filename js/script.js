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

  // ---- WORKS ----
  // PC版：左の画像は固定。右は選択中の項目を真ん中にして上下の3つだけを見せ、
  //       ホイール・スワイプ・上下キー・クリックで1つずつ切り替える
  // スマホ版：全項目を縦に並べ、画面の真ん中に一番近い項目を選択中にする
  var worksList = document.getElementById('worksList');
  var worksWindow = document.getElementById('worksWindow');
  if (worksList && worksWindow) {
    var worksItems = Array.prototype.slice.call(worksList.querySelectorAll('.works-item'));
    var worksImg = document.querySelector('.works-visual-img');
    var worksPlaceholder = document.querySelector('.works-visual-placeholder');
    var worksLink = document.querySelector('.works-link');
    var worksDesktop = window.matchMedia('(min-width: 861px)');
    var worksIndex = -1;

    // 切り替えたときに一瞬空白にならないよう、画像を先に読み込んでおく
    worksItems.forEach(function (item) {
      var src = item.getAttribute('data-image');
      if (src) new Image().src = src;
    });

    var markWorksItems = function (index) {
      worksItems.forEach(function (item, i) {
        item.classList.toggle('is-active', i === index);
        item.classList.toggle('is-near', Math.abs(i - index) === 1);
      });
    };

    var showWorksImage = function (item) {
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

      var link = item.getAttribute('data-link');
      worksLink.hidden = !link;
      if (link) {
        worksLink.href = link;
        worksLink.setAttribute('aria-label', item.querySelector('p').textContent + 'の配信を見る');
      }
    };

    // 指定した項目が選択中のときの、3つ分の高さと、その項目の中心の位置を測る
    var measureWorks = function (index) {
      markWorksItems(index);
      var first = worksItems[Math.max(index - 1, 0)];
      var last = worksItems[Math.min(index + 1, worksItems.length - 1)];
      var active = worksItems[index];
      return {
        top: first.offsetTop,
        bottom: last.offsetTop + last.offsetHeight,
        center: active.offsetTop + active.offsetHeight / 2
      };
    };

    // 窓の高さは「どの項目を選んでも3つが収まる高さ」に固定する
    var worksWindowHeight = function () {
      var halfHeight = 0;
      worksItems.forEach(function (item, i) {
        var m = measureWorks(i);
        halfHeight = Math.max(halfHeight, m.center - m.top, m.bottom - m.center);
      });
      return Math.ceil(halfHeight * 2);
    };

    var setWorksIndex = function (index, animate) {
      index = Math.max(0, Math.min(index, worksItems.length - 1));
      var previous = worksIndex;
      if (!worksDesktop.matches) {
        worksIndex = index;
        markWorksItems(index);
        showWorksImage(worksItems[index]);
        return;
      }
      // 大きさの変化が終わった後の位置を、アニメーションなしで先に測る
      worksList.classList.add('no-anim');
      var height = parseFloat(worksWindow.style.height) || worksWindowHeight();
      var target = measureWorks(index);
      if (animate && previous >= 0) markWorksItems(previous);
      worksList.getBoundingClientRect();
      worksList.classList.remove('no-anim');
      if (!animate) worksList.getBoundingClientRect();
      worksIndex = index;
      markWorksItems(index);
      worksWindow.style.height = height + 'px';
      worksList.style.transform = 'translateY(' + Math.round(height / 2 - target.center) + 'px)';
      showWorksImage(worksItems[index]);
    };

    // PC版とスマホ版の切り替え時、文字の読み込み後に位置を計算し直す
    var layoutWorks = function () {
      worksWindow.style.height = '';
      worksList.style.transform = '';
      if (worksDesktop.matches) {
        worksList.classList.add('no-anim');
        worksWindow.style.height = worksWindowHeight() + 'px';
        worksList.classList.remove('no-anim');
        setWorksIndex(worksIndex < 0 ? 1 : worksIndex, false);
      } else {
        updateWorksOnScroll();
      }
    };

    var worksTicking = false;
    var updateWorksOnScroll = function () {
      worksTicking = false;
      if (worksDesktop.matches) return;
      var center = window.innerHeight / 2;
      var closest = 0;
      var closestDistance = Infinity;
      worksItems.forEach(function (item, i) {
        var rect = item.getBoundingClientRect();
        var distance = Math.abs(rect.top + rect.height / 2 - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = i;
        }
      });
      if (closest !== worksIndex) setWorksIndex(closest, true);
    };
    window.addEventListener('scroll', function () {
      if (!worksTicking) {
        worksTicking = true;
        requestAnimationFrame(updateWorksOnScroll);
      }
    }, { passive: true });

    // PC版：操作がないときは一定時間ごとに次の項目へ進む（最後まで行ったら最初に戻る）
    // キーボードで選択中、画面に見えていない間、別タブの間は進めない
    var WORKS_AUTO_MS = 4000;
    var worksShowcase = worksList.closest('.works-showcase');
    var worksReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var worksAutoTimer = null;

    // WORKSが半分以上画面に見えているか
    var isWorksInView = function () {
      var rect = worksShowcase.getBoundingClientRect();
      var visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      return visible >= rect.height / 2;
    };

    var scheduleWorksAuto = function () {
      clearTimeout(worksAutoTimer);
      if (!worksDesktop.matches || worksReduceMotion.matches) return;
      worksAutoTimer = setTimeout(function () {
        var focused = !!worksShowcase.querySelector(':focus-visible');
        if (!document.hidden && isWorksInView() && !focused) {
          setWorksIndex((worksIndex + 1) % worksItems.length, true);
        }
        scheduleWorksAuto();
      }, WORKS_AUTO_MS);
    };

    // ホイール：端に着いたら止めず、そのままページがスクロールするようにする
    var worksWheelTotal = 0;
    var worksWheelLocked = false;
    worksWindow.addEventListener('wheel', function (e) {
      if (!worksDesktop.matches) return;
      var direction = e.deltaY > 0 ? 1 : -1;
      var next = worksIndex + direction;
      if (next < 0 || next >= worksItems.length) return;
      e.preventDefault();
      if (worksWheelLocked) return;
      worksWheelTotal += e.deltaY;
      if (Math.abs(worksWheelTotal) < 40) return;
      worksWheelTotal = 0;
      worksWheelLocked = true;
      setWorksIndex(next, true);
      scheduleWorksAuto();
      setTimeout(function () { worksWheelLocked = false; }, 450);
    }, { passive: false });

    // スワイプ（タブレットなど）
    var worksTouchY = null;
    worksWindow.addEventListener('touchstart', function (e) {
      worksTouchY = e.touches[0].clientY;
    }, { passive: true });
    worksWindow.addEventListener('touchend', function (e) {
      if (!worksDesktop.matches || worksTouchY === null) return;
      var moved = worksTouchY - e.changedTouches[0].clientY;
      worksTouchY = null;
      if (Math.abs(moved) > 30) setWorksIndex(worksIndex + (moved > 0 ? 1 : -1), true);
      scheduleWorksAuto();
    }, { passive: true });

    // 上下キー
    worksWindow.addEventListener('keydown', function (e) {
      if (!worksDesktop.matches) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var next = worksIndex + (e.key === 'ArrowDown' ? 1 : -1);
        if (next < 0 || next >= worksItems.length) return;
        e.preventDefault();
        setWorksIndex(next, true);
        scheduleWorksAuto();
      }
    });

    // クリック：PC版はその項目を選択、スマホ版はその項目が画面の真ん中に来るようにスクロール
    worksItems.forEach(function (item, i) {
      item.addEventListener('click', function () {
        if (worksDesktop.matches) {
          setWorksIndex(i, true);
          scheduleWorksAuto();
        } else {
          item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    worksDesktop.addEventListener('change', function () {
      worksIndex = -1;
      layoutWorks();
      scheduleWorksAuto();
    });
    window.addEventListener('resize', layoutWorks);
    window.addEventListener('load', layoutWorks);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutWorks);
    layoutWorks();
    scheduleWorksAuto();
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
