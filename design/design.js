(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setProjectState(project, open) {
    const content = project.querySelector(".project-content");
    const plus = project.querySelector(".project-plus");
    const explore = project.querySelector(".project-explore");

    if (!content) return;

    content.hidden = !open;
    project.classList.toggle("is-open", open);

    if (plus) {
      plus.setAttribute("aria-expanded", String(open));
      plus.textContent = open ? "—" : "+";
    }

    if (explore) {
      explore.setAttribute("aria-expanded", String(open));
    }
  }

  document.querySelectorAll(".project").forEach(project => {
    const plus = project.querySelector(".project-plus");
    const explore = project.querySelector(".project-explore");
    const close = project.querySelector(".project-close");

    plus?.addEventListener("click", () => {
      setProjectState(project, !project.classList.contains("is-open"));
    });

    explore?.addEventListener("click", () => setProjectState(project, true));

    close?.addEventListener("click", () => {
      setProjectState(project, false);
      project.querySelector(".project-summary")?.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  document.querySelectorAll("[data-media-switcher]").forEach(switcher => {
    const toggle = switcher.querySelector(".media-switcher-toggle");
    const stage = switcher.querySelector(".media-switcher-stage");

    const setSecondary = secondary => {
      switcher.classList.toggle("is-secondary", secondary);
      toggle?.setAttribute("aria-pressed", String(secondary));
    };

    const toggleMedia = () => setSecondary(!switcher.classList.contains("is-secondary"));

    toggle?.addEventListener("click", toggleMedia);

    if (stage) {
      stage.tabIndex = 0;
      stage.setAttribute("role", "button");
      stage.setAttribute("aria-label", "Switch between artwork and installed view");
      stage.addEventListener("click", toggleMedia);
      stage.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleMedia();
        }
      });
    }
  });

  const foldout = document.querySelector("[data-foldout]");

  if (foldout) {
    const project = foldout.closest(".project");
    const foldButton = project?.querySelector(".foldout-fold");
    const sideButton = project?.querySelector(".foldout-side");
    const stateLabel = project?.querySelector(".foldout-state");
    const flatReference = foldout.querySelector(".foldout-flat-reference");

    let folded = false;
    let inside = false;

    const refresh = () => {
      const flatImage = inside
        ? "assets/better angels takeaway inside.png"
        : "assets/better angels takeaway outside.png";

      if (flatReference) {
        flatReference.src = flatImage;
        flatReference.alt = `Better Angels takeaway folder shown flat, ${inside ? "inside" : "outside"}`;
      }

      foldout.classList.toggle("is-folded", folded);
      foldout.classList.toggle("show-inside", inside && !folded);
      foldout.setAttribute("aria-pressed", String(folded));

      if (foldButton) {
        foldButton.textContent = folded ? "open folder" : "close folder";
        foldButton.setAttribute("aria-pressed", String(folded));
      }

      if (sideButton) {
        sideButton.textContent = inside ? "view outside" : "view inside";
        sideButton.setAttribute("aria-pressed", String(inside));
        sideButton.disabled = folded;
      }

      if (stateLabel) {
        stateLabel.textContent = folded ? "closed" : `flat / ${inside ? "inside" : "outside"}`;
      }
    };

    const toggleFold = () => {
      if (!folded && inside) inside = false;
      folded = !folded;
      refresh();
    };

    foldButton?.addEventListener("click", toggleFold);

    sideButton?.addEventListener("click", () => {
      if (folded) return;
      inside = !inside;
      refresh();
    });

    foldout.addEventListener("click", toggleFold);
    foldout.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFold();
      }
    });

    refresh();
  }

  document.querySelectorAll("[data-flyer]").forEach(flyer => {
    const button = flyer.querySelector(".flyer-flip");
    const state = flyer.querySelector(".flyer-state");
    const scene = flyer.querySelector(".flyer-scene");
    let flipped = false;

    const refresh = () => {
      flyer.classList.toggle("is-flipped", flipped);
      button?.setAttribute("aria-pressed", String(flipped));
      if (button) button.textContent = flipped ? "front" : "flip";
      if (state) state.textContent = flipped ? "reverse" : "front";
    };

    const toggle = () => {
      flipped = !flipped;
      refresh();
    };

    button?.addEventListener("click", toggle);
    scene?.addEventListener("click", toggle);
    scene?.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });

    refresh();
  });
})();
