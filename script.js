(() => {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const header = document.querySelector(".site-header");
  const nav = document.querySelector("#primary-nav");
  const toggle = document.querySelector(".nav-toggle");
  const backdrop = document.querySelector(".nav-backdrop");
  const backToTop = document.querySelector(".back-to-top");
  const yearNodes = document.querySelectorAll("[data-year]");

  yearNodes.forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */

  let navOpen = false;

  const unlockPageScroll = () => {
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow");
  };

  const lockPageScroll = () => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  };

  const getFocusable = () => {
    if (!nav) return [];

    return [
      toggle,
      ...nav.querySelectorAll("a, button")
    ].filter(Boolean);
  };

  const setNav = (open) => {
    navOpen = Boolean(open);

    if (!nav || !toggle) {
      unlockPageScroll();
      return;
    }

    toggle.setAttribute(
      "aria-expanded",
      navOpen ? "true" : "false"
    );

    toggle.setAttribute(
      "aria-label",
      navOpen ? "Close menu" : "Open menu"
    );

    nav.classList.toggle("is-open", navOpen);

    if (backdrop) {
      backdrop.classList.toggle("is-open", navOpen);
    }

    if (header) {
      header.classList.toggle("nav-open", navOpen);

      if (navOpen) {
        header.classList.remove("is-hidden");
      }
    }

    if (navOpen) {
      lockPageScroll();
    } else {
      unlockPageScroll();
    }
  };

  const closeNav = () => {
    const wasOpen = navOpen;

    setNav(false);

    if (wasOpen && toggle) {
      toggle.focus();
    }
  };

  setNav(false);

  window.addEventListener("pageshow", () => {
    setNav(false);

    if (header) {
      header.classList.remove("is-hidden");
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960 && navOpen) {
      setNav(false);
    }
  });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      setNav(!navOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        setNav(false);
      });
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeNav);
    }

    document.addEventListener("click", (event) => {
      if (!navOpen) return;

      const target = event.target;

      if (!(target instanceof Node)) return;
      if (nav.contains(target)) return;
      if (toggle.contains(target)) return;

      closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navOpen) {
        event.preventDefault();
        closeNav();
        return;
      }

      if (!navOpen || event.key !== "Tab") return;

      const focusable = getFocusable();

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Header scroll behavior

     Scroll down:
     Header hides.

     Scroll up:
     Header returns immediately.

     Stop scrolling:
     Header returns after 2 seconds.
     ---------------------------------------------------------------------- */

  if (header) {
    let previousScrollY = Math.max(0, window.scrollY);
    let previousDirection = 0;
    let directionDistance = 0;
    let stopTimer;
    let headerLogCount = 0;

    const logHeader = (hypothesisId, message, extra) => {
      // #region agent log
      const styles = window.getComputedStyle(header);
      const payload = {
          sessionId: "30547c",
          runId: "pre-fix",
          hypothesisId,
          location: "script.js:header-scroll",
          message,
          data: {
            ...extra,
            reducedMotion,
            navOpen,
            scrollY: window.scrollY,
            hasHiddenClass: header.classList.contains("is-hidden"),
            position: styles.position,
            transform: styles.transform,
            top: styles.top,
            htmlOverflow: document.documentElement.style.overflow || window.getComputedStyle(document.documentElement).overflow,
            bodyOverflow: document.body.style.overflow || window.getComputedStyle(document.body).overflow
          },
          timestamp: Date.now()
        };
      fetch("http://127.0.0.1:7605/ingest/fdfc05bc-57f0-4c8e-8fea-ea766c4bee1c", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "30547c"
        },
        body: JSON.stringify(payload)
      }).catch(() => {});
      try {
        navigator.sendBeacon(
          "http://127.0.0.1:7605/ingest/fdfc05bc-57f0-4c8e-8fea-ea766c4bee1c",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } catch (e) {}
      // #endregion
    };

    const showHeader = () => {
      header.classList.remove("is-hidden");
    };

    const hideHeader = () => {
      if (!navOpen && window.scrollY > 10) {
        header.classList.add("is-hidden");
      }
    };

    const handleHeaderScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY);
      const scrollDifference =
        currentScrollY - previousScrollY;

      const currentDirection =
        scrollDifference > 0
          ? 1
          : scrollDifference < 0
            ? -1
            : 0;

      window.clearTimeout(stopTimer);

      if (navOpen || currentScrollY <= 10) {
        showHeader();
        directionDistance = 0;
      } else if (currentDirection !== 0) {
        if (currentDirection !== previousDirection) {
          directionDistance = 0;
        }

        directionDistance += Math.abs(scrollDifference);

        /*
         * Show quickly when scrolling upward.
         */
        if (
          currentDirection === -1 &&
          directionDistance >= 2
        ) {
          showHeader();
        }

        /*
         * Require a little more downward movement before hiding.
         * This prevents small trackpad movements from causing glitches.
         */
        if (
          currentDirection === 1 &&
          directionDistance >= 6
        ) {
          hideHeader();
        }

        previousDirection = currentDirection;
      }

      previousScrollY = currentScrollY;

      if (headerLogCount < 8) {
        headerLogCount += 1;
        logHeader("A-B-C", "header scroll tick", {
          currentDirection,
          directionDistance,
          scrollDifference,
          reducedMotionMedia: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        });
      }

      stopTimer = window.setTimeout(() => {
        showHeader();
        directionDistance = 0;
        logHeader("D", "stop-timer showed header", {});
      }, 2000);
    };

    window.addEventListener(
      "scroll",
      handleHeaderScroll,
      {
        passive: true
      }
    );

    showHeader();
    logHeader("E", "header scroll init", {
      headerFound: Boolean(header)
    });
  }

  /* ----------------------------------------------------------------------
     Repeating reveal animations
     ---------------------------------------------------------------------- */

  const revealSelector =
    ".reveal, .reveal-up, .reveal-fade, " +
    ".reveal-left, .reveal-right, " +
    ".reveal-scale, .reveal-diagonal";

  document
    .querySelectorAll("[data-stagger]")
    .forEach((group) => {
      const items =
        group.querySelectorAll(revealSelector);

      items.forEach((item, index) => {
        item.style.setProperty(
          "--delay",
          `${index * 90}ms`
        );
      });
    });

  const revealItems =
    document.querySelectorAll(revealSelector);

  if (reducedMotion) {
    revealItems.forEach((item) => {
      item.classList.add("is-visible");
    });
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            "is-visible",
            entry.isIntersecting
          );
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealItems.forEach((item) => {
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => {
      item.classList.add("is-visible");
    });
  }

  /* ----------------------------------------------------------------------
     Menu category navigation
     ---------------------------------------------------------------------- */

  const menuNav =
    document.querySelector(".menu-nav");

  const menuSections =
    document.querySelectorAll(".menu-section[id]");

  if (menuNav && menuSections.length) {
    const links = [
      ...menuNav.querySelectorAll("a[href^='#']")
    ];

    let activeMenuId = "";

    const centerMenuLink = (link) => {
      const navRect =
        menuNav.getBoundingClientRect();

      const linkRect =
        link.getBoundingClientRect();

      const targetLeft =
        menuNav.scrollLeft +
        linkRect.left -
        navRect.left -
        (menuNav.clientWidth - linkRect.width) / 2;

      menuNav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: reducedMotion ? "auto" : "smooth"
      });
    };

    const setActive = (id) => {
      if (activeMenuId === id) return;

      activeMenuId = id;
      let activeLink = null;

      links.forEach((link) => {
        const isActive =
          link.getAttribute("href") === `#${id}`;

        link.classList.toggle(
          "is-active",
          isActive
        );

        if (isActive) {
          activeLink = link;
        }
      });

      if (activeLink) {
        centerMenuLink(activeLink);
      }
    };

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (!href) return;

        const target =
          document.querySelector(href);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: reducedMotion
            ? "auto"
            : "smooth",
          block: "start"
        });

        setActive(target.id);
      });
    });

    if ("IntersectionObserver" in window) {
      const sectionObserver =
        new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((entry) => entry.isIntersecting)
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio
              )[0];

            if (visible) {
              setActive(visible.target.id);
            }
          },
          {
            rootMargin: "-35% 0px -50% 0px",
            threshold: [0.1, 0.25, 0.5]
          }
        );

      menuSections.forEach((section) => {
        sectionObserver.observe(section);
      });
    }
  }

  /* ----------------------------------------------------------------------
     Back to top
     ---------------------------------------------------------------------- */

  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.classList.toggle(
        "is-visible",
        window.scrollY > 600
      );
    };

    window.addEventListener(
      "scroll",
      updateBackToTop,
      {
        passive: true
      }
    );

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion
          ? "auto"
          : "smooth"
      });
    });

    updateBackToTop();
  }
})();