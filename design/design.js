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
