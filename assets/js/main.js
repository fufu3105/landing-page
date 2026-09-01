(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let storedTheme = null;

  try {
    storedTheme = localStorage.getItem('iris-theme');
  } catch (error) {
    storedTheme = null;
  }

  if (storedTheme !== 'light' && storedTheme !== 'dark') {
    storedTheme = null;
  }

  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';

    if (themeToggle) {
      const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    }

    if (themeColor) {
      themeColor.setAttribute('content', isDark ? '#0B1120' : '#F8FAFC');
    }
  };

  applyTheme(storedTheme || (systemTheme.matches ? 'dark' : 'light'));

  themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    storedTheme = nextTheme;

    try {
      localStorage.setItem('iris-theme', nextTheme);
    } catch (error) {
      // The selected theme remains active for the current session.
    }

    window.requestAnimationFrame(() => updateActiveNavigation());
  });

  const followSystemTheme = (event) => {
    if (!storedTheme) {
      applyTheme(event.matches ? 'dark' : 'light');
      window.requestAnimationFrame(() => updateActiveNavigation());
    }
  };

  if (typeof systemTheme.addEventListener === 'function') {
    systemTheme.addEventListener('change', followSystemTheme);
  }

  // Mobile navigation
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('primary-navigation');
  const mobileNavigation = window.matchMedia('(max-width: 1080px)');

  const setNavigationState = (isOpen) => {
    if (!navToggle || !navLinks) return;

    const isMobile = mobileNavigation.matches;
    const shouldOpen = isMobile && isOpen;
    navLinks.classList.toggle('open', shouldOpen);
    navToggle.setAttribute('aria-expanded', String(shouldOpen));
    navToggle.setAttribute('aria-label', shouldOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('menu-open', shouldOpen);

    if (isMobile) {
      navLinks.setAttribute('aria-hidden', String(!shouldOpen));
      navLinks.inert = !shouldOpen;
    } else {
      navLinks.removeAttribute('aria-hidden');
      navLinks.inert = false;
    }
  };

  if (navToggle && navLinks) {
    setNavigationState(false);

    navToggle.addEventListener('click', () => {
      setNavigationState(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setNavigationState(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setNavigationState(false);
        navToggle.focus();
      }
    });

    const syncNavigation = () => setNavigationState(false);
    if (typeof mobileNavigation.addEventListener === 'function') {
      mobileNavigation.addEventListener('change', syncNavigation);
    }
  }

  // Keep the navigation highlight synchronized with the current section.
  const sectionLinks = navLinks
    ? Array.from(navLinks.querySelectorAll('a[href^="#"]'))
    : [];
  const sectionNavigation = sectionLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((item) => item.section);
  const navElement = document.querySelector('.nav');
  const toneRegions = Array.from(document.querySelectorAll('main > section, footer'));
  let navigationFrame = null;

  const updateActiveNavigation = () => {
    navigationFrame = null;
    const navHeight = navElement?.offsetHeight || 74;
    const readingLine = window.scrollY + navHeight + Math.min(window.innerHeight * 0.24, 180);
    let activeItem = null;

    sectionNavigation.forEach((item) => {
      if (item.section.offsetTop <= readingLine) activeItem = item;
    });

    sectionNavigation.forEach(({ link }) => {
      const isActive = Boolean(activeItem && link === activeItem.link);
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (navElement && toneRegions.length) {
      const surfaceLine = navHeight + 2;
      let currentRegion = toneRegions.find((region) => {
        const bounds = region.getBoundingClientRect();
        return bounds.top <= surfaceLine && bounds.bottom > surfaceLine;
      });

      if (!currentRegion) {
        currentRegion = toneRegions[0];
        toneRegions.forEach((region) => {
          if (region.offsetTop <= window.scrollY + surfaceLine) currentRegion = region;
        });
      }

      const useDarkSurface = root.dataset.theme === 'dark'
        || currentRegion?.dataset.navTone === 'dark';
      navElement.dataset.surface = useDarkSurface ? 'dark' : 'light';
    }
  };

  const requestNavigationUpdate = () => {
    if (navigationFrame !== null) return;
    navigationFrame = window.requestAnimationFrame(updateActiveNavigation);
  };

  updateActiveNavigation();
  window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
  window.addEventListener('resize', requestNavigationUpdate);

  // Scroll reveal
  const revealElements = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -28px' });

    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  // Flip cards to reveal descriptions by click, keyboard, dwell, or a one-time viewport demo.
  const cardControllers = [];
  const canHover = window.matchMedia('(hover: hover)').matches;

  document.querySelectorAll('.card-disclosure').forEach((disclosure) => {
    const card = disclosure.closest('article, li');
    const cardTitle = card?.querySelector('h3')?.textContent?.trim() || 'this card';
    if (!card) return;

    card.classList.add('interactive-detail-card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    card.setAttribute('aria-label', `Show more information about ${cardTitle}`);

    const state = {
      animating: false,
      pending: null,
      pinned: false,
      hoverOpened: false,
      hoverTimer: null
    };

    const updateAccessibility = (isOpen) => {
      card.setAttribute('aria-expanded', String(isOpen));
      card.setAttribute('aria-label', `${isOpen ? 'Hide' : 'Show'} more information about ${cardTitle}`);
    };

    const setCardState = (isOpen) => {
      if (state.animating) {
        state.pending = isOpen;
        return;
      }
      if (disclosure.open === isOpen) return;

      if (reduceMotion) {
        disclosure.open = isOpen;
        card.classList.toggle('is-flipped', isOpen);
        updateAccessibility(isOpen);
        requestNavigationUpdate();
        return;
      }

      state.animating = true;
      const turnOut = card.animate(
        {
          transform: ['perspective(1000px) rotateY(0deg)', 'perspective(1000px) rotateY(90deg)'],
          opacity: [1, .72]
        },
        { duration: 260, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'forwards' }
      );

      turnOut.onfinish = () => {
        disclosure.open = isOpen;
        card.classList.toggle('is-flipped', isOpen);
        updateAccessibility(isOpen);

        card.style.transform = `perspective(1000px) rotateY(${isOpen ? -90 : 90}deg)`;
        card.style.opacity = '.72';
        turnOut.cancel();

        const turnIn = card.animate(
          {
            transform: [`perspective(1000px) rotateY(${isOpen ? -90 : 90}deg)`, 'perspective(1000px) rotateY(0deg)'],
            opacity: [.72, 1]
          },
          { duration: 300, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' }
        );

        turnIn.onfinish = () => {
          card.style.transform = '';
          card.style.opacity = '';
          turnIn.cancel();
          state.animating = false;
          requestNavigationUpdate();

          const pendingState = state.pending;
          state.pending = null;
          if (pendingState !== null && pendingState !== disclosure.open) {
            window.requestAnimationFrame(() => setCardState(pendingState));
          }
        };
      };
    };

    const togglePinnedState = () => {
      const currentOrPendingState = state.pending ?? disclosure.open;
      const nextState = !currentOrPendingState;
      state.pinned = nextState;
      state.hoverOpened = false;
      setCardState(nextState);
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      togglePinnedState();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      togglePinnedState();
    });

    if (canHover) {
      card.addEventListener('pointerenter', () => {
        window.clearTimeout(state.hoverTimer);
        if (state.pinned || disclosure.open) return;

        state.hoverTimer = window.setTimeout(() => {
          state.hoverOpened = true;
          setCardState(true);
        }, 1500);
      });

      card.addEventListener('pointerleave', () => {
        window.clearTimeout(state.hoverTimer);
        if (!state.hoverOpened || state.pinned) return;
        state.hoverOpened = false;
        setCardState(false);
      });
    }

    cardControllers.push({ card, disclosure, state, setCardState });
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        demoObserver.unobserve(entry.target);
        const controller = cardControllers.find(({ card }) => card === entry.target);
        if (!controller) return;

        const group = Array.from(entry.target.parentElement?.children || []);
        const stagger = Math.max(0, group.indexOf(entry.target)) * 120;

        window.setTimeout(() => {
          const { disclosure, state, setCardState } = controller;
          if (state.pinned || state.hoverOpened || disclosure.open) return;

          setCardState(true);
          window.setTimeout(() => {
            if (!state.pinned && !state.hoverOpened) setCardState(false);
          }, 1350);
        }, stagger);
      });
    }, { threshold: .55, rootMargin: '0px 0px -8% 0px' });

    cardControllers.forEach(({ card }) => demoObserver.observe(card));
  }

  // Product concept explorer
  const productExplorer = document.getElementById('productExplorer');
  const productTrack = document.getElementById('productScreens');
  const productScreens = Array.from(document.querySelectorAll('.preview-card'));
  let activeProductScreen = 0;
  let productTrackInView = false;
  let productFocusPaused = false;
  let productPauseUntil = 0;
  let productLastFrame = null;

  const pauseProductLoop = (duration = 2400) => {
    productPauseUntil = Math.max(productPauseUntil, performance.now() + duration);
  };

  if (productTrack && !reduceMotion) {
    const trackObserver = new IntersectionObserver((entries) => {
      productTrackInView = entries.some((entry) => entry.isIntersecting);
      productLastFrame = null;
    }, { threshold: 0.12 });

    trackObserver.observe(productTrack);

    productTrack.addEventListener('pointerdown', () => {
      pauseProductLoop();
    });

    productTrack.addEventListener('wheel', () => {
      pauseProductLoop();
    }, { passive: true });

    productTrack.addEventListener('focusin', () => {
      productFocusPaused = true;
    });

    productTrack.addEventListener('focusout', (event) => {
      if (!productTrack.contains(event.relatedTarget)) {
        productFocusPaused = false;
      }
    });

    const moveProductTrack = (time) => {
      if (productLastFrame === null) productLastFrame = time;

      const elapsed = Math.min(time - productLastFrame, 50);
      productLastFrame = time;
      const isPaused = !productTrackInView
        || productFocusPaused
        || document.hidden
        || time < productPauseUntil;

      if (!isPaused) {
        productTrack.scrollLeft += elapsed * 0.1;

        const firstCard = productTrack.firstElementChild;
        if (firstCard) {
          const trackStyles = getComputedStyle(productTrack);
          const gap = parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
          const cardStep = firstCard.getBoundingClientRect().width + gap;

          if (productTrack.scrollLeft >= cardStep) {
            productTrack.scrollLeft -= cardStep;
            productTrack.append(firstCard);
          }
        }
      }

      requestAnimationFrame(moveProductTrack);
    };

    requestAnimationFrame(moveProductTrack);
  }

  productExplorer?.addEventListener('click', () => {
    if (!productScreens.length) return;
    pauseProductLoop(3000);
    activeProductScreen = (activeProductScreen + 1) % productScreens.length;
    productScreens[activeProductScreen].scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  });
})();
