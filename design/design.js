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
  document.querySelectorAll(
    ".portfolio-masthead h1, .project-family-heading h2, .project-title, .case-section__header h3, .making-public-intro h4"
  ).forEach((element) => {
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


(() => {
  "use strict";

  /* v51 paper surface: overlapping feathered sheets. The layer lives inside
     the page so it scrolls naturally, and rebuilds when projects expand. */
  const shell = document.querySelector(".page-shell");
  if (!shell) return;

  const textures = [
    "/assets/home/Texturelabs_Paper_170L_organic paper overlay.jpg",
    "/assets/home/Texturelabs_Paper_226L_paper overlay.jpg",
    "/assets/home/Texturelabs_Paper_231L_watercolor paper overlay..jpg"
  ];

  const layer = document.createElement("div");
  layer.className = "paper-overprint";
  layer.setAttribute("aria-hidden", "true");
  shell.appendChild(layer);

  const SHEET_HEIGHT = 1380;
  const STEP = 1020;
  let lastCount = 0;

  function rebuildPaper() {
    const height = Math.max(shell.scrollHeight, document.documentElement.scrollHeight, window.innerHeight);
    const count = Math.max(2, Math.ceil((height + 360) / STEP));
    if (count === lastCount) {
      layer.style.height = `${height}px`;
      return;
    }

    layer.replaceChildren();
    layer.style.height = `${height}px`;

    for (let i = 0; i < count; i += 1) {
      const sheet = document.createElement("div");
      sheet.className = "paper-overprint__sheet";
      sheet.style.top = `${i * STEP - (i ? 180 : 0)}px`;
      sheet.style.backgroundImage = `url("${textures[i % textures.length]}")`;
      sheet.style.backgroundPosition = `${18 + ((i * 29) % 64)}% ${12 + ((i * 17) % 70)}%`;
      layer.appendChild(sheet);
    }

    lastCount = count;
  }

  rebuildPaper();
  window.addEventListener("load", rebuildPaper, { once: true });
  window.addEventListener("resize", rebuildPaper);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(rebuildPaper);
    observer.observe(shell);
  }
})();

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

/* v53: one continuous paper overlay. Remove v51/v52 generated sheet tiles. */
(() => {
  "use strict";
  const shell = document.querySelector(".page-shell");
  if (!shell) return;

  document.querySelectorAll(".paper-overprint").forEach((node) => node.remove());
  const layer = document.createElement("div");
  layer.className = "paper-overprint";
  layer.setAttribute("aria-hidden", "true");
  shell.appendChild(layer);

  const sync = () => {
    const height = Math.max(shell.scrollHeight, document.documentElement.scrollHeight, window.innerHeight);
    layer.style.height = `${height}px`;
  };
  sync();
  window.addEventListener("load", sync, { once:true });
  window.addEventListener("resize", sync);
  if ("ResizeObserver" in window) new ResizeObserver(sync).observe(shell);
})();

/* v53: Across formats asset pairs are explicit and hover-driven on desktop. */
(() => {
  "use strict";

  const pairs = [
    ["/design/assets/more connection lyric.png", "/design/assets/more connection lyric photo.png"],
    ["/design/assets/more depth.png", "/design/assets/more depth image.png"],
    ["/design/assets/more fun bus.png", "/design/assets/more fun bus image.png"]
  ];

  const desktopHover = window.matchMedia("(hover:hover) and (pointer:fine)");
  document.querySelectorAll(".switcher-grid--three [data-switcher]").forEach((switcher, index) => {
    const primary = switcher.querySelector(".state-primary");
    const secondary = switcher.querySelector(".state-secondary");
    const button = switcher.querySelector(".image-switcher__button");
    const pair = pairs[index];
    if (pair) {
      if (primary) primary.src = pair[0];
      if (secondary) secondary.src = pair[1];
    }

    const stage = switcher.querySelector(".image-switcher__stage");
    if (!stage) return;

    const showInstalled = () => {
      if (!desktopHover.matches) return;
      primary?.style.setProperty("opacity", "0", "important");
      secondary?.style.setProperty("opacity", "1", "important");
      button?.setAttribute("aria-pressed", "true");
    };
    const showArtwork = () => {
      if (!desktopHover.matches) return;
      primary?.style.removeProperty("opacity");
      secondary?.style.removeProperty("opacity");
      button?.setAttribute("aria-pressed", String(switcher.classList.contains("is-secondary")));
    };

    stage.addEventListener("pointerenter", showInstalled);
    stage.addEventListener("pointerleave", showArtwork);
  });
})();

/* v54: deterministic Across formats hover preview.
   Use the exact supplied asset pairs and a dedicated class so older hover CSS
   cannot cancel the installed-photo state. */
(() => {
  "use strict";

  const pairs = [
    ["/design/assets/more connection lyric.png", "/design/assets/more connection lyric photo.png"],
    ["/design/assets/more depth.png", "/design/assets/more depth image.png"],
    ["/design/assets/more fun bus.png", "/design/assets/more fun bus image.png"]
  ];
  const canHover = window.matchMedia("(hover:hover) and (pointer:fine)");

  document.querySelectorAll(".switcher-grid--three [data-switcher]").forEach((switcher, index) => {
    const stage = switcher.querySelector(".image-switcher__stage");
    const primary = switcher.querySelector(".state-primary");
    const secondary = switcher.querySelector(".state-secondary");
    const button = switcher.querySelector(".image-switcher__button");
    const pair = pairs[index];
    if (!stage || !primary || !secondary || !pair) return;

    primary.src = pair[0];
    secondary.src = pair[1];

    /* Decode the installed photograph before hover so there is no blank frame. */
    const preload = new Image();
    preload.src = pair[1];
    if (preload.decode) preload.decode().catch(() => {});

    const enter = () => {
      if (!canHover.matches) return;
      switcher.classList.add("is-hover-secondary");
      button?.setAttribute("aria-pressed", "true");
    };
    const leave = () => {
      if (!canHover.matches) return;
      switcher.classList.remove("is-hover-secondary");
      button?.setAttribute("aria-pressed", String(switcher.classList.contains("is-secondary")));
    };

    stage.addEventListener("pointerenter", enter);
    stage.addEventListener("pointerleave", leave);
  });
})();

/* v57: lighter paper only over image rectangles.
   The main paper layer stays above type/lines/knots, while media itself remains
   above that layer. These stamps restore a restrained amount of paper to media
   without putting the full page texture back over photographs/artwork. */
(() => {
  "use strict";

  const shell = document.querySelector(".page-shell");
  const designPage = document.querySelector(".design-page");
  if (!shell || !designPage) return;

  document.querySelectorAll(".media-paper-stamps").forEach((node) => node.remove());

  const layer = document.createElement("div");
  layer.className = "media-paper-stamps";
  layer.setAttribute("aria-hidden", "true");
  shell.appendChild(layer);

  let raf = 0;

  const sync = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const shellRect = shell.getBoundingClientRect();
      const shellHeight = Math.max(shell.scrollHeight, document.documentElement.scrollHeight, window.innerHeight);
      layer.style.height = `${shellHeight}px`;
      layer.replaceChildren();

      const rects = [];
      const seen = new Set();

      designPage.querySelectorAll(".project img").forEach((img) => {
        if (!img.complete || img.naturalWidth === 0) return;
        const style = getComputedStyle(img);
        if (style.display === "none" || style.visibility === "hidden") return;

        const r = img.getBoundingClientRect();
        if (r.width < 12 || r.height < 12) return;

        /* Front/back flip faces often occupy the same rectangle. Only texture
           that rectangle once so flip assets do not get double-strength paper. */
        const key = [
          Math.round(r.left),
          Math.round(r.top),
          Math.round(r.width),
          Math.round(r.height)
        ].join(":");
        if (seen.has(key)) return;
        seen.add(key);
        rects.push(r);
      });

      rects.forEach((r, index) => {
        const stamp = document.createElement("div");
        stamp.className = "media-paper-stamp";
        stamp.style.left = `${r.left - shellRect.left + shell.scrollLeft}px`;
        stamp.style.top = `${r.top - shellRect.top + shell.scrollTop}px`;
        stamp.style.width = `${r.width}px`;
        stamp.style.height = `${r.height}px`;

        /* Small deterministic offsets stop every image from showing the exact
           same fibre patch without introducing random movement between loads. */
        stamp.style.setProperty("--media-paper-x", `${18 + ((index * 29) % 67)}%`);
        stamp.style.setProperty("--media-paper-y", `${14 + ((index * 19) % 71)}%`);
        stamp.style.setProperty("--media-paper-x2", `${11 + ((index * 37) % 79)}%`);
        stamp.style.setProperty("--media-paper-y2", `${21 + ((index * 23) % 63)}%`);
        layer.appendChild(stamp);
      });
    });
  };

  designPage.querySelectorAll(".project img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", sync, { once:true });
  });

  sync();
  window.addEventListener("load", sync, { once:true });
  window.addEventListener("resize", sync);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(sync);
    observer.observe(shell);
  }
})();

/* =====================================================
   v59 — Across formats deterministic hover lock
   Exact pairs are enforced here so the first two switchers behave exactly like
   the already-working bus switcher. No layout or other interaction changes.
   ===================================================== */
(() => {
  "use strict";

  const pairs = [
    ["/design/assets/more connection lyric.png", "/design/assets/more connection lyric photo.png"],
    ["/design/assets/more depth.png", "/design/assets/more depth image.png"],
    ["/design/assets/more fun bus.png", "/design/assets/more fun bus image.png"]
  ];

  const canHover = window.matchMedia("(hover:hover) and (pointer:fine)");
  const switchers = Array.from(document.querySelectorAll(".switcher-grid--three [data-switcher]"));

  switchers.forEach((switcher, index) => {
    const pair = pairs[index];
    const stage = switcher.querySelector(".image-switcher__stage");
    const primary = switcher.querySelector("img.state-primary");
    const secondary = switcher.querySelector("img.state-secondary");
    const button = switcher.querySelector(".image-switcher__button");
    if (!pair || !stage || !primary || !secondary) return;

    primary.src = pair[0];
    secondary.src = pair[1];

    const preload = new Image();
    preload.src = pair[1];
    if (preload.decode) preload.decode().catch(() => {});

    const showInstalled = () => {
      if (!canHover.matches) return;
      switcher.classList.add("is-installed-preview");
      button?.setAttribute("aria-pressed", "true");
    };

    const showArtwork = () => {
      switcher.classList.remove("is-installed-preview");
      button?.setAttribute("aria-pressed", String(switcher.classList.contains("is-secondary")));
    };

    stage.addEventListener("pointerenter", showInstalled);
    stage.addEventListener("pointerleave", showArtwork);
    stage.addEventListener("pointercancel", showArtwork);
  });
})();
