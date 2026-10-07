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

  /* Smooth knots behave like a misregistered screen print: the drawing stays
     fixed in place, but the ink layer swaps abruptly. Idle glitches are rare;
     hover keeps the print unstable until the pointer leaves. */
  const knotSources = [
    "/assets/home/knot_smooth_svg1.svg",
    "/assets/home/knot_smooth_svg2.svg",
    "/assets/home/knot_smooth_svg3.svg",
    "/assets/home/knot_smooth_svg4.svg",
    "/assets/home/knot_smooth_svg5.svg"
  ];

  const knotColorClasses = [
    "knot-flash--red",
    "knot-flash--green",
    "knot-flash--yellow"
  ];

  document.querySelectorAll("[data-knot-flash]").forEach((slot, slotIndex) => {
    const images = slot.querySelectorAll("img");
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    let currentIndex = slotIndex % knotSources.length;
    let colorIndex = slotIndex % knotColorClasses.length;
    let timer = 0;
    let hovering = false;

    const setKnot = (index) => images.forEach((image) => { image.src = knotSources[index]; });

    const chooseNext = () => {
      let next = Math.floor(Math.random() * knotSources.length);
      if (next === currentIndex) next = (next + 1) % knotSources.length;
      currentIndex = next;
      colorIndex = (colorIndex + 1 + Math.floor(Math.random() * 2)) % knotColorClasses.length;
      knotColorClasses.forEach((className) => slot.classList.remove(className));
      slot.classList.add(knotColorClasses[colorIndex]);
      setKnot(currentIndex);
    };

    const clearTimer = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    const scheduleIdle = () => {
      clearTimer();
      if (reducedMotion.matches || hovering) return;
      timer = window.setTimeout(idleBurst, 32000 + Math.random() * 18000);
    };

    const idleBurst = () => {
      if (reducedMotion.matches || hovering) return;
      slot.classList.add("is-fluttering");
      const swaps = 3 + Math.floor(Math.random() * 3);
      let count = 0;

      const step = () => {
        chooseNext();
        count += 1;
        if (count < swaps) {
          timer = window.setTimeout(step, 55 + Math.random() * 55);
        } else {
          slot.classList.remove("is-fluttering");
          scheduleIdle();
        }
      };

      step();
    };

    const hoverLoop = () => {
      if (!hovering || reducedMotion.matches) return;
      chooseNext();
      timer = window.setTimeout(hoverLoop, 55 + Math.random() * 70);
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
      slot.classList.remove("is-hover-glitch");
      scheduleIdle();
    };

    setKnot(currentIndex);
    scheduleIdle();
    slot.addEventListener("mouseenter", startHover);
    slot.addEventListener("mouseleave", stopHover);

    reducedMotion.addEventListener?.("change", () => {
      clearTimer();
      hovering = false;
      slot.classList.remove("is-fluttering", "is-hover-glitch");
      if (!reducedMotion.matches) scheduleIdle();
    });
  });
})();
