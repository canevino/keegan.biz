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
