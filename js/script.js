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
    }, { rootMargin: '0px 0px -15% 0px' }); // 要素の割合で判定すると、画面より大幅に背の高い要素が出てこなくなる
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
  function setupYt(el) {
    var src = el.getAttribute('data-url') || el.getAttribute('data-id') || '';
    var match = src.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    var id = match ? match[1] : src.trim();
    var title = el.getAttribute('data-title') || '動画';
    if (!id) return;
    el.style.cursor = '';

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

    // class="yt yt-no-button" のときは再生ボタンを出さず、枠そのものをボタンとして扱う
    // （キーボードでも選んで Enter / スペースで再生できるようにする）
    var noButton = el.classList.contains('yt-no-button');
    var onKey = function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    };
    if (noButton) {
      el.replaceChildren(thumb);
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', title + 'を再生');
      el.addEventListener('keydown', onKey);
    } else {
      var play = document.createElement('button');
      play.type = 'button';
      play.className = 'yt-play';
      play.setAttribute('aria-label', title + 'を再生');
      el.replaceChildren(thumb, play);
    }

    el.addEventListener('click', function () {
      var player = document.createElement('iframe');
      player.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      player.title = title;
      player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      player.allowFullscreen = true;
      el.replaceChildren(player);
      el.style.cursor = 'auto';
      if (noButton) {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
        el.removeEventListener('keydown', onKey);
      }
    }, { once: true });
  }
  document.querySelectorAll('.yt').forEach(setupYt);

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
  // 画像は固定。リストは選択中の項目を真ん中にして上下の3つだけを見せ、
  // ホイール・上下キー・クリック（タップ）で1つずつ切り替える。操作がなければ自動で進む
  // スワイプはPC幅のみ（スマホはページの縦スクロールとぶつかるため）
  var worksList = document.getElementById('worksList');
  var worksWindow = document.getElementById('worksWindow');
  if (worksList && worksWindow) {
    var worksItems = Array.prototype.slice.call(worksList.querySelectorAll('.works-item'));
    var worksImg = document.querySelector('.works-visual-img');
    var worksPlaceholder = document.querySelector('.works-visual-placeholder');
    var worksLink = document.querySelector('.works-link');
    var worksSwipeEnabled = window.matchMedia('(min-width: 861px)');
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

    // 画面幅が変わったとき、文字の読み込み後に位置を計算し直す
    var layoutWorks = function () {
      worksWindow.style.height = '';
      worksList.style.transform = '';
      worksList.classList.add('no-anim');
      worksWindow.style.height = worksWindowHeight() + 'px';
      worksList.classList.remove('no-anim');
      setWorksIndex(worksIndex < 0 ? 1 : worksIndex, false);
    };

    // 操作がないときは一定時間ごとに次の項目へ進む（最後まで行ったら最初に戻る）
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
      if (worksReduceMotion.matches) return;
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
      if (!worksSwipeEnabled.matches || worksTouchY === null) return;
      var moved = worksTouchY - e.changedTouches[0].clientY;
      worksTouchY = null;
      if (Math.abs(moved) > 30) setWorksIndex(worksIndex + (moved > 0 ? 1 : -1), true);
      scheduleWorksAuto();
    }, { passive: true });

    // 上下キー
    worksWindow.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var next = worksIndex + (e.key === 'ArrowDown' ? 1 : -1);
        if (next < 0 || next >= worksItems.length) return;
        e.preventDefault();
        setWorksIndex(next, true);
        scheduleWorksAuto();
      }
    });

    // クリック（タップ）：その項目を選択
    worksItems.forEach(function (item, i) {
      item.addEventListener('click', function () {
        setWorksIndex(i, true);
        scheduleWorksAuto();
      });
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
    // 3枚目を真ん中にして、左右にカードが並んで見える位置から始める
    var centerMusicCards = function () {
      var carousel = document.querySelector('.music-carousel');
      var visible = Array.prototype.filter.call(musicCards, function (card) { return !card.hidden; });
      var target = visible[Math.min(2, visible.length - 1)];
      if (target) carousel.scrollLeft = target.offsetLeft + target.offsetWidth / 2 - carousel.clientWidth / 2;
    };
    window.addEventListener('load', centerMusicCards);

    // PICK UP：曲一覧からランダムに1曲を選んで表示する（ページを開くたびに変わる）
    var musicPickup = document.getElementById('musicPickup');
    if (musicPickup && musicCards.length) {
      var pickedCard = musicCards[Math.floor(Math.random() * musicCards.length)];
      var pickedVideo = pickedCard.querySelector('.yt');
      var pickupVideo = musicPickup.querySelector('.yt');
      pickupVideo.setAttribute('data-url', pickedVideo.getAttribute('data-url'));
      pickupVideo.setAttribute('data-title', pickedVideo.getAttribute('data-title'));
      setupYt(pickupVideo);
      musicPickup.hidden = false;
    }

    // 曲名が1行に収まらないときだけ、文字を小さくして1行に収める
    var fitMusicTitles = function () {
      document.querySelectorAll('.music-title').forEach(function (title) {
        if (title.closest('.music-card').hidden) return;
        title.style.fontSize = '';
        var style = getComputedStyle(title);
        var before = getComputedStyle(title, '::before');
        var after = getComputedStyle(title, '::after');
        var range = document.createRange();
        range.selectNodeContents(title);
        var textWidth = range.getBoundingClientRect().width;
        var available = title.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) -
          parseFloat(before.width) - parseFloat(after.width) - parseFloat(style.columnGap) * 2;
        if (textWidth > available) {
          title.style.fontSize = Math.floor(parseFloat(style.fontSize) * (available / textWidth) * 2) / 2 + 'px';
        }
      });
    };
    window.addEventListener('load', fitMusicTitles);
    window.addEventListener('resize', fitMusicTitles);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMusicTitles);
    musicFilter.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');
        musicFilter.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('is-active', b === button);
          b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
        });
        musicCards.forEach(function (card) {
          card.hidden = filter !== 'all' && card.getAttribute('data-artist') !== filter;
          // 隠すカードで再生中の動画は止めて、サムネイルに戻す
          var video = card.querySelector('.yt');
          if (card.hidden && video.querySelector('iframe')) setupYt(video);
        });
        fitMusicTitles();
        centerMusicCards();
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
    // ドラッグした直後のクリックでは動画を再生しない
    musicCarousel.addEventListener('click', function (e) {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }, true);

    // 操作がないときは一定時間ごとに次のカードへ進む（最後まで行ったら最初に戻る）
    // 動画の再生中、ドラッグ中、キーボードで選択中、画面に見えていない間、別タブの間は進めない
    var MUSIC_AUTO_MS = 4000;
    var musicReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var musicAutoTimer = null;

    var isMusicInView = function () {
      var rect = musicCarousel.getBoundingClientRect();
      var visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      return visible >= rect.height / 2;
    };

    var nextMusicCard = function () {
      var cards = Array.prototype.filter.call(musicCarousel.querySelectorAll('.music-card'), function (card) {
        return !card.hidden;
      });
      if (cards.length < 2) return;
      var center = musicCarousel.scrollLeft + musicCarousel.clientWidth / 2;
      var current = 0;
      var closestDistance = Infinity;
      cards.forEach(function (card, i) {
        var distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          current = i;
        }
      });
      var next = cards[(current + 1) % cards.length];
      musicCarousel.scrollTo({
        left: next.offsetLeft + next.offsetWidth / 2 - musicCarousel.clientWidth / 2,
        behavior: 'smooth'
      });
    };

    var scheduleMusicAuto = function () {
      clearTimeout(musicAutoTimer);
      if (musicReduceMotion.matches) return;
      musicAutoTimer = setTimeout(function () {
        var busy = isPointerDown || document.querySelector('.music-page iframe') ||
          document.querySelector('.music-page :focus-visible');
        if (!document.hidden && isMusicInView() && !busy) nextMusicCard();
        scheduleMusicAuto();
      }, MUSIC_AUTO_MS);
    };

    ['pointerdown', 'wheel', 'touchstart'].forEach(function (type) {
      musicCarousel.addEventListener(type, scheduleMusicAuto, { passive: true });
    });
    if (musicFilter) musicFilter.addEventListener('click', scheduleMusicAuto);
    scheduleMusicAuto();
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
