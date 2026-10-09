(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setProjectState(project, open) {
    const content = project.querySelector(".project-content");
    const toggle = project.querySelector(".project-toggle");
    if (!content || !toggle) return;

    project.classList.toggle("is-open", open);
    content.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));

    if (open && !reduceMotion.matches) {
      requestAnimationFrame(() => {
        content.animate(
          [
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 220, easing: "ease-out" }
        );
      });
    }
  }

  const projects = Array.from(document.querySelectorAll("[data-project]"));

  projects.forEach((project, index) => {
    const toggle = project.querySelector(".project-toggle");
    const initiallyOpen = false;
    setProjectState(project, initiallyOpen);

    toggle?.addEventListener("click", () => {
      const opening = !project.classList.contains("is-open");
      setProjectState(project, opening);

      if (opening) {
        project.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  });

  document.querySelectorAll("[data-switcher]").forEach((switcher) => {
    const button = switcher.querySelector(".image-switcher__button");
    const stage = switcher.querySelector(".image-switcher__stage");

    function flipState() {
      const isSecondary = switcher.classList.toggle("is-secondary");
      button?.setAttribute("aria-pressed", String(isSecondary));
      if (button) button.textContent = isSecondary ? "artwork" : "in use";
    }

    button?.addEventListener("click", (event) => {
      event.stopPropagation();
      flipState();
    });

    stage?.addEventListener("click", flipState);
    stage?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        flipState();
      }
    });
  });

  document.querySelectorAll("[data-flip-card]").forEach((card) => {
    const button = card.querySelector(".flip-card__button");
    const scene = card.querySelector(".flip-card__scene");

    function setFlipped(flipped) {
      card.classList.toggle("is-flipped", flipped);
      button?.setAttribute("aria-pressed", String(flipped));
      if (button) button.textContent = "flip";
    }

    function toggleFlipped() {
      setFlipped(!card.classList.contains("is-flipped"));
    }

    setFlipped(false);

    button?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFlipped();
    });

    scene?.addEventListener("click", toggleFlipped);
    scene?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFlipped();
      }
    });
  });
})();

(() => {
  "use strict";

  document.querySelectorAll("[data-folder]").forEach((specimen) => {
    const flip = specimen.querySelector(".folder-flip");
    const fold = specimen.querySelector(".folder-fold");
    const stage = specimen.querySelector(".folder-stage");
    let folded = false;
    let flipped = false;

    const sync = () => {
      specimen.classList.toggle("is-folded", folded);
      specimen.classList.toggle("is-flipped", flipped);
      fold?.setAttribute("aria-pressed", String(folded));
      flip?.setAttribute("aria-pressed", String(flipped));
      if (fold) fold.textContent = folded ? "unfold" : "fold";
      if (flip) flip.textContent = "flip";
      stage?.setAttribute("aria-pressed", String(folded));
    };

    const toggleFold = () => {
      folded = !folded;
      sync();
    };

    fold?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFold();
    });

    flip?.addEventListener("click", (event) => {
      event.stopPropagation();
      flipped = !flipped;
      sync();
    });

    stage?.addEventListener("click", toggleFold);
    stage?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFold();
      }
    });

    sync();
  });
})();

(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Large display faces use pseudo-layers for registration and material
     texture. Set their duplicate text from the actual DOM so the effect never
     drifts from edited copy. */
  document.querySelectorAll(".portfolio-masthead h1").forEach((element) => {
    element.setAttribute("data-print-text", element.textContent.trim());
  });

  /* Legacy page-height sync is harmless if no long spine is present. */
  function syncPageKnotLength() {
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );
    document.documentElement.style.setProperty("--page-knot-length", `${height}px`);
  }

  syncPageKnotLength();
  window.addEventListener("load", syncPageKnotLength, { once: true });
  window.addEventListener("resize", syncPageKnotLength);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(syncPageKnotLength);
    resizeObserver.observe(document.body);
  }

  /* Smooth knots behave like a misregistered screen print. All SVG variants
     are fully decoded before swaps begin so the filtered layers never flash
     clean while a new source is loading. */
  const knotSources = [
    "/assets/home/knot_smooth_svg1.svg",
    "/assets/home/knot_smooth_svg2.svg",
    "/assets/home/knot_smooth_svg3.svg",
    "/assets/home/knot_smooth_svg4.svg",
    "/assets/home/knot_smooth_svg5.svg"
  ];

  const knotColorClasses = [
    "knot-flash--black",
    "knot-flash--red",
    "knot-flash--green",
    "knot-flash--yellow"
  ];

  const knotCache = knotSources.map(async (source) => {
    const preload = new Image();
    preload.decoding = "async";
    preload.src = source;

    try {
      await preload.decode();
    } catch (error) {
      await new Promise((resolve) => {
        if (preload.complete) {
          resolve();
          return;
        }
        preload.addEventListener("load", resolve, { once: true });
        preload.addEventListener("error", resolve, { once: true });
      });
    }

    return { source, image: preload };
  });

  Promise.all(knotCache).then(() => {
    document.querySelectorAll("[data-knot-flash]").forEach((slot, slotIndex) => {
      const images = slot.querySelectorAll("img");
      const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
      const pickDifferentIndex = (exclude) => {
        if (knotSources.length <= 1) return 0;
        let next = Math.floor(Math.random() * knotSources.length);
        while (next === exclude) next = Math.floor(Math.random() * knotSources.length);
        return next;
      };
      let settledIndex = Math.floor(Math.random() * knotSources.length);
      let currentIndex = settledIndex;
      const existingColorIndex = knotColorClasses.findIndex((className) => slot.classList.contains(className));
      let colorIndex = existingColorIndex >= 0 ? existingColorIndex : slotIndex % knotColorClasses.length;
      let timer = 0;
      let hovering = false;

      const setKnot = (index) => {
        const source = knotSources[index];
        images.forEach((image) => {
          image.decoding = "sync";
          if (image.getAttribute("src") !== source) image.setAttribute("src", source);
        });
        void slot.offsetWidth;
      };

      const setColor = (index) => {
        knotColorClasses.forEach((className) => slot.classList.remove(className));
        slot.classList.add(knotColorClasses[index]);
      };

      const chooseNext = () => {
        /* Walk through the hand-drawn set while the knot is active, but do not
           force the resting state back to the same default drawing. */
        currentIndex = (currentIndex + 1) % knotSources.length;
        colorIndex = (colorIndex + 1) % knotColorClasses.length;
        setColor(colorIndex);
        setKnot(currentIndex);
      };

      const chooseSettled = () => {
        settledIndex = pickDifferentIndex(currentIndex);
        currentIndex = settledIndex;
        setKnot(currentIndex);
      };

      const clearTimer = () => {
        window.clearTimeout(timer);
        timer = 0;
      };

      const scheduleIdle = () => {
        clearTimer();
        if (reducedMotion.matches || hovering) return;
        timer = window.setTimeout(idleBurst, 30000 + Math.random() * 12000);
      };

      const idleBurst = () => {
        if (reducedMotion.matches || hovering) return;
        slot.classList.add("is-fluttering");
        const swaps = 14 + Math.floor(Math.random() * 7);
        let count = 0;
        const step = () => {
          chooseNext();
          count += 1;
          if (count < swaps) timer = window.setTimeout(step, 28 + Math.random() * 28);
          else {
            chooseSettled();
            slot.classList.remove("is-fluttering");
            scheduleIdle();
          }
        };
        step();
      };

      const hoverLoop = () => {
        if (!hovering || reducedMotion.matches) return;
        chooseNext();
        timer = window.setTimeout(hoverLoop, 30 + Math.random() * 26);
      };

      const startHover = () => {
        if (!canHover.matches || reducedMotion.matches) return;
        hovering = true;
        clearTimer();
        slot.classList.remove("is-fluttering");
        slot.classList.add("is-hover-glitch");
        hoverLoop();
      };

      const stopHover = () => {
        if (!hovering) return;
        hovering = false;
        clearTimer();
        chooseSettled();
        slot.classList.remove("is-hover-glitch");
        scheduleIdle();
      };

      setColor(colorIndex);
      setKnot(currentIndex);
      slot.classList.add("is-knot-ready");
      scheduleIdle();
      slot.addEventListener("pointerenter", startHover);
      slot.addEventListener("pointerleave", stopHover);

      reducedMotion.addEventListener?.("change", () => {
        clearTimer();
        hovering = false;
        slot.classList.remove("is-fluttering", "is-hover-glitch");
        if (!reducedMotion.matches) scheduleIdle();
      });
    });
  });
})();


/* v67 — paper overlay removed; flat background only. */

/* v52: deterministic Across formats states + guaranteed knot texture mask. */
(() => {
  "use strict";

  document.querySelectorAll("[data-knot-flash]").forEach((slot) => {
    const first = slot.querySelector("img");
    const syncMask = () => {
      const src = first?.getAttribute("src");
      if (src) slot.style.setProperty("--knot-mask-image", `url("${src}")`);
    };
    syncMask();
    if (first) {
      new MutationObserver(syncMask).observe(first, { attributes:true, attributeFilter:["src"] });
    }
  });

  document.querySelectorAll(".switcher-grid--three [data-switcher]").forEach((switcher) => {
    const primary = switcher.querySelector(".state-primary");
    const secondary = switcher.querySelector(".state-secondary");
    const button = switcher.querySelector(".image-switcher__button");

    const sync = () => {
      const secondaryOn = switcher.classList.contains("is-secondary");
      primary?.setAttribute("aria-hidden", String(secondaryOn));
      secondary?.setAttribute("aria-hidden", String(!secondaryOn));
      if (button) {
        button.setAttribute("aria-pressed", String(secondaryOn));
        button.textContent = secondaryOn ? "artwork" : "in use";
      }
    };

    sync();
    new MutationObserver(sync).observe(switcher, { attributes:true, attributeFilter:["class"] });
  });
})();

/* Design masthead interaction lock: the word “design” is intentionally static.
   Remove any legacy smudge node/class if an older build left one in the DOM. */
(() => {
  "use strict";
  document.querySelectorAll(".design-hover-smudge").forEach((node) => node.remove());
  document.querySelectorAll(".portfolio-masthead__main.is-smudging").forEach((node) => {
    node.classList.remove("is-smudging");
    node.style.removeProperty("--smudge-x");
    node.style.removeProperty("--smudge-y");
  });
})();

/* v67 — no generated paper overlay. */

/* v61 — deterministic hover previews.
   LOCK: exact Triennial asset pairs. Hover is temporary; click/tap remains the
   persistent state. This replaces accumulated CSS-only hover behavior. */
(() => {
  "use strict";

  const canHover = window.matchMedia("(hover:hover) and (pointer:fine)");
  const pairs = [
    ["/design/assets/more connection lyric.png", "/design/assets/more connection lyric photo.png"],
    ["/design/assets/more depth.png", "/design/assets/more depth image.png"],
    ["/design/assets/more fun bus.png", "/design/assets/more fun bus image.png"]
  ];

  document.querySelectorAll("#project-triennial .switcher-grid--three [data-switcher]").forEach((switcher, index) => {
    const stage = switcher.querySelector(".image-switcher__stage");
    const primary = switcher.querySelector(".state-primary");
    const secondary = switcher.querySelector(".state-secondary");
    const button = switcher.querySelector(".image-switcher__button");
    const pair = pairs[index];
    if (!stage || !primary || !secondary || !pair) return;

    primary.src = pair[0];
    secondary.src = pair[1];

    const preload = new Image();
    preload.src = pair[1];
    preload.decode?.().catch(() => {});

    const syncButton = () => {
      const installed = switcher.classList.contains("is-secondary");
      if (button) {
        button.setAttribute("aria-pressed", String(installed));
        button.textContent = installed ? "artwork" : "in use";
      }
    };

    stage.addEventListener("pointerenter", () => {
      if (!canHover.matches) return;
      switcher.classList.add("is-hover-secondary");
    });

    stage.addEventListener("pointerleave", () => {
      switcher.classList.remove("is-hover-secondary");
      syncButton();
    });

    syncButton();
  });
})();

/* v61 — deterministic flip-card hover.
   Old raw :hover transforms caused Public Processes and Making Public to fight
   the click state and appear to jump. The class below is the only hover state. */
(() => {
  "use strict";
  const canHover = window.matchMedia("(hover:hover) and (pointer:fine)");

  document.querySelectorAll("#project-triennial [data-flip-card]").forEach((card) => {
    const scene = card.querySelector(".flip-card__scene");
    if (!scene) return;

    scene.addEventListener("pointerenter", () => {
      if (canHover.matches) card.classList.add("is-hover-flipped");
    });
    scene.addEventListener("pointerleave", () => {
      card.classList.remove("is-hover-flipped");
    });
  });
})();

/* v66 — Lyrik installed-photo stage fill
   LOCK: Across Formats layout, hover state logic, bus sizing, More Depth sizing,
   Extensions, Making Public, paper, print effects, knots and Better Angels remain unchanged.
   CSS accumulation was still forcing the Lyrik installed photo to `contain`.
   Apply the final geometry inline with !important so the photograph always fills
   the already-approved portrait stage and only excess horizontal image area crops. */
(() => {
  "use strict";

  const applyLyrikInstalledGeometry = () => {
    const switchers = Array.from(
      document.querySelectorAll("#project-triennial .switcher-grid--three [data-switcher]")
    );

    const lyrik = switchers.find((switcher) => {
      const primary = switcher.querySelector(".state-primary");
      return /more connection lyric\.png(?:$|\?)/i.test(primary?.getAttribute("src") || "");
    }) || switchers[0];

    if (!lyrik) return;

    const stage = lyrik.querySelector(".image-switcher__stage--portrait");
    const installed = lyrik.querySelector(".state-secondary");
    if (!stage || !installed) return;

    stage.style.setProperty("overflow", "hidden", "important");

    installed.style.setProperty("position", "absolute", "important");
    installed.style.setProperty("inset", "0", "important");
    installed.style.setProperty("width", "100%", "important");
    installed.style.setProperty("height", "100%", "important");
    installed.style.setProperty("max-width", "none", "important");
    installed.style.setProperty("max-height", "none", "important");
    installed.style.setProperty("margin", "0", "important");
    installed.style.setProperty("object-fit", "cover", "important");
    installed.style.setProperty("object-position", "center center", "important");
    installed.style.setProperty("transform", "none", "important");
  };

  applyLyrikInstalledGeometry();
  window.addEventListener("load", applyLyrikInstalledGeometry, { once:true });
})();
