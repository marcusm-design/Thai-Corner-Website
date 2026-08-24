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
  const contactForm = document.querySelector("#contact-form");

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

    return [toggle, ...nav.querySelectorAll("a, button")].filter(Boolean);
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
    }

    if (navOpen) {
      lockPageScroll();

      if (header) {
        header.classList.remove("is-hidden");
      }
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

  /*
   * Always unlock scrolling when the page first loads.
   * This also fixes pages restored through the browser back button.
   */
  setNav(false);

  window.addEventListener("pageshow", () => {
    setNav(false);
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
     Hide / show header on scroll
     ---------------------------------------------------------------------- */

  if (header && !reducedMotion) {
    let lastY = window.scrollY;
    let stopTimer;

    const onScrollHeader = () => {
      if (navOpen) {
        header.classList.remove("is-hidden");
        return;
      }

      const y = window.scrollY;

      if (y < 12) {
        header.classList.remove("is-hidden");
      } else if (y > lastY + 6) {
        header.classList.add("is-hidden");
      } else if (y < lastY - 6) {
        header.classList.remove("is-hidden");
      }

      lastY = y;

      window.clearTimeout(stopTimer);

      stopTimer = window.setTimeout(() => {
        header.classList.remove("is-hidden");
      }, 900);
    };

    window.addEventListener("scroll", onScrollHeader, {
      passive: true
    });
  }

  /* ----------------------------------------------------------------------
     Repeating reveal animations
     ---------------------------------------------------------------------- */

  const revealSelector =
    ".reveal, .reveal-up, .reveal-fade, .reveal-left, " +
    ".reveal-right, .reveal-scale, .reveal-diagonal";

  document.querySelectorAll("[data-stagger]").forEach((group) => {
    const items = group.querySelectorAll(revealSelector);

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

  const menuNav = document.querySelector(".menu-nav");

  const menuSections =
    document.querySelectorAll(".menu-section[id]");

  if (menuNav && menuSections.length) {
    const links = [
      ...menuNav.querySelectorAll("a[href^='#']")
    ];

    let activeMenuId = "";

    /*
     * Horizontally centers the active category without using
     * scrollIntoView, which can interfere with vertical page scrolling.
     */
    const centerMenuLink = (link) => {
      const navRect = menuNav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();

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

        link.classList.toggle("is-active", isActive);

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

        const target = document.querySelector(href);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start"
        });

        setActive(target.id);
      });
    });

    if ("IntersectionObserver" in window) {
      const sectionObserver = new IntersectionObserver(
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
    const onScrollTop = () => {
      backToTop.classList.toggle(
        "is-visible",
        window.scrollY > 600
      );
    };

    window.addEventListener("scroll", onScrollTop, {
      passive: true
    });

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth"
      });
    });

    onScrollTop();
  }

  /* ----------------------------------------------------------------------
     Contact form placeholder
     ---------------------------------------------------------------------- */

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const status =
        document.querySelector("#form-status");

      if (status) {
        status.classList.add("is-visible");
        status.focus();
      }
    });
  }
})();