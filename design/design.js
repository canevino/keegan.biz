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

  /* Keep the rotated long-knot spine exactly as tall as the page, including
     when accordion projects open or close. */
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

  /* Smooth knots behave like an unstable printed registration: a short burst
     of rapid swaps/distortion, then a longer quiet hold. */
  const knotSources = [
    "/assets/home/knot_smooth_svg1.svg",
    "/assets/home/knot_smooth_svg2.svg",
    "/assets/home/knot_smooth_svg3.svg",
    "/assets/home/knot_smooth_svg4.svg",
    "/assets/home/knot_smooth_svg5.svg"
  ];

  const knotColorClasses = [
    "knot-flash--red",
    "knot-flash--moss",
    "knot-flash--violet"
  ];

  document.querySelectorAll("[data-knot-flash]").forEach((slot, slotIndex) => {
    const images = slot.querySelectorAll("img");
    let currentIndex = slotIndex % knotSources.length;
    let colorIndex = slotIndex % knotColorClasses.length;
    let timer;

    const setKnot = (index) => images.forEach((image) => { image.src = knotSources[index]; });

    const randomizeShape = () => {
      const sx = .82 + Math.random() * .52;
      const sy = .72 + Math.random() * .56;
      const skew = -10 + Math.random() * 20;
      const rotate = -3 + Math.random() * 6;
      slot.style.setProperty("--knot-sx", sx.toFixed(3));
      slot.style.setProperty("--knot-sy", sy.toFixed(3));
      slot.style.setProperty("--knot-skew", `${skew.toFixed(2)}deg`);
      slot.style.setProperty("--knot-rotate", `${rotate.toFixed(2)}deg`);
    };

    const chooseNext = () => {
      let next = Math.floor(Math.random() * knotSources.length);
      if (next === currentIndex) next = (next + 1) % knotSources.length;
      currentIndex = next;
      colorIndex = (colorIndex + 1 + Math.floor(Math.random() * 2)) % knotColorClasses.length;
      knotColorClasses.forEach((className) => slot.classList.remove(className));
      slot.classList.add(knotColorClasses[colorIndex]);
      setKnot(currentIndex);
      randomizeShape();
    };

    const burst = () => {
      if (reducedMotion.matches) return;
      slot.classList.add("is-fluttering");
      const swaps = 5 + Math.floor(Math.random() * 7);
      let count = 0;

      const flutter = () => {
        chooseNext();
        count += 1;
        if (count < swaps) {
          timer = window.setTimeout(flutter, 45 + Math.random() * 85);
        } else {
          slot.classList.remove("is-fluttering");
          slot.classList.add("is-settling");
          window.setTimeout(() => slot.classList.remove("is-settling"), 180);
          timer = window.setTimeout(burst, 3000 + Math.random() * 6500);
        }
      };

      flutter();
    };

    setKnot(currentIndex);
    randomizeShape();
    if (!reducedMotion.matches) timer = window.setTimeout(burst, 650 + slotIndex * 260 + Math.random() * 900);

    reducedMotion.addEventListener?.("change", () => {
      window.clearTimeout(timer);
      slot.classList.remove("is-fluttering", "is-settling");
      if (!reducedMotion.matches) timer = window.setTimeout(burst, 600);
    });
  });
})();
