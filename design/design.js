(() => {
  "use strict";

  const projects = document.querySelectorAll(".project");

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

  projects.forEach(project => {
    const plus = project.querySelector(".project-plus");
    const explore = project.querySelector(".project-explore");
    const close = project.querySelector(".project-close");

    if (plus) {
      plus.addEventListener("click", () => {
        setProjectState(project, !project.classList.contains("is-open"));
      });
    }

    if (explore) {
      explore.addEventListener("click", () => setProjectState(project, true));
    }

    if (close) {
      close.addEventListener("click", () => {
        setProjectState(project, false);
        const summary = project.querySelector(".project-summary");
        if (summary) {
          summary.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start"
          });
        }
      });
    }
  });

  document.querySelectorAll("[data-media-switcher]").forEach(switcher => {
    const toggle = switcher.querySelector(".media-switcher-toggle");
    const stage = switcher.querySelector(".media-switcher-stage");

    const toggleMedia = () => {
      const secondary = switcher.classList.toggle("is-secondary");
      if (toggle) toggle.setAttribute("aria-pressed", String(secondary));
    };

    if (toggle) toggle.addEventListener("click", toggleMedia);

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
    const panelImages = foldout.querySelectorAll(".fold-panel img");

    let step = 0;
    let inside = false;

    const refreshFoldout = () => {
      const image = inside
        ? "assets/better angels takeaway inside.png"
        : "assets/better angels takeaway outside.png";

      panelImages.forEach(img => { img.src = image; });

      if (flatReference) {
        flatReference.src = image;
        flatReference.alt = `Better Angels takeaway folder shown flat, ${inside ? "inside" : "outside"}`;
      }

      foldout.dataset.step = String(step);

      if (sideButton) {
        sideButton.textContent = inside ? "view outside" : "view inside";
        sideButton.setAttribute("aria-pressed", String(inside));
      }

      if (foldButton) {
        foldButton.textContent = step === 0 ? "fold sides" : step === 1 ? "fold lower panel" : "unfold";
        foldButton.setAttribute("aria-pressed", String(step > 0));
      }

      if (stateLabel) {
        const state = step === 0 ? "flat" : step === 1 ? "sides folded" : "folded";
        stateLabel.textContent = `${state} / ${inside ? "inside" : "outside"}`;
      }
    };

    if (sideButton) {
      sideButton.addEventListener("click", () => {
        inside = !inside;
        refreshFoldout();
      });
    }

    if (foldButton) {
      foldButton.addEventListener("click", () => {
        step = step === 0 ? 1 : step === 1 ? 2 : 0;
        refreshFoldout();
      });
    }

    foldout.tabIndex = 0;
    foldout.setAttribute("aria-label", "Interactive Better Angels takeaway folder");
    foldout.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        step = step === 0 ? 1 : step === 1 ? 2 : 0;
        refreshFoldout();
      }
    });

    refreshFoldout();
  }

  document.querySelectorAll("[data-flyer]").forEach(flyer => {
    const flipButton = flyer.querySelector(".flyer-flip");
    const foldButton = flyer.querySelector(".flyer-fold");
    const stateLabel = flyer.querySelector(".flyer-state");
    const scene = flyer.querySelector(".flyer-scene");

    let flipped = false;
    let folded = false;

    const refreshFlyer = () => {
      flyer.classList.toggle("is-flipped", flipped);
      flyer.classList.toggle("is-folded", folded);

      if (flipButton) {
        flipButton.textContent = flipped ? "front" : "flip";
        flipButton.setAttribute("aria-pressed", String(flipped));
      }

      if (foldButton) {
        foldButton.textContent = folded ? "unfold" : "fold";
        foldButton.setAttribute("aria-pressed", String(folded));
      }

      if (stateLabel) {
        stateLabel.textContent = `${flipped ? "reverse" : "front"} / ${folded ? "folded" : "flat"}`;
      }
    };

    const toggleFlip = () => {
      flipped = !flipped;
      refreshFlyer();
    };

    if (flipButton) flipButton.addEventListener("click", toggleFlip);

    if (foldButton) {
      foldButton.addEventListener("click", () => {
        folded = !folded;
        refreshFlyer();
      });
    }

    if (scene) {
      scene.addEventListener("click", toggleFlip);
      scene.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleFlip();
        }
      });
    }

    refreshFlyer();
  });

})();
