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

    explore?.setAttribute("aria-expanded", String(open));
  }

  document.querySelectorAll(".project").forEach(project => {
    const plus = project.querySelector(".project-plus");
    const explore = project.querySelector(".project-explore");
    const close = project.querySelector(".project-close");

    plus?.addEventListener("click", () => {
      setProjectState(project, !project.classList.contains("is-open"));
    });

    explore?.addEventListener("click", () => {
      setProjectState(project, true);
    });

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

    const flip = () => {
      const secondary = switcher.classList.toggle("is-secondary");
      toggle?.setAttribute("aria-pressed", String(secondary));
    };

    toggle?.addEventListener("click", event => {
      event.stopPropagation();
      flip();
    });

    if (stage) {
      stage.tabIndex = 0;
      stage.setAttribute("role", "button");
      stage.setAttribute("aria-label", "Switch between artwork and installed view");
      stage.addEventListener("click", flip);
      stage.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          flip();
        }
      });
    }
  });

  const folder = document.querySelector("[data-ba-folder]");

  if (folder) {
    const project = folder.closest(".project");
    const flipButton = project?.querySelector(".ba-folder-side");
    const frontImages = folder.querySelectorAll(".ba-folder-face-front img");
    const backImages = folder.querySelectorAll(".ba-folder-face-back img");

    let flipped = false;
    let folded = false;
    let animating = false;
    let timer = null;

    const outsideSrc = "assets/better angels takeaway outside.png";
    const insideSrc = "assets/better angels takeaway inside.png";

    function syncFaces() {
      const frontSrc = flipped ? insideSrc : outsideSrc;
      const backSrc = flipped ? outsideSrc : insideSrc;

      frontImages.forEach(image => { image.src = frontSrc; });
      backImages.forEach(image => { image.src = backSrc; });

      folder.classList.toggle("is-flipped", flipped);
      folder.setAttribute("aria-pressed", String(folded));
      flipButton?.setAttribute("aria-pressed", String(flipped));
      if (flipButton) flipButton.disabled = animating;
    }

    function finishFold() {
      folded = true;
      animating = false;
      folder.classList.remove("is-folding");
      folder.classList.add("is-folded");
      syncFaces();
    }

    function foldFolder() {
      if (folded || animating) return;
      animating = true;
      folder.classList.remove("is-unfolding", "is-folded");
      folder.classList.add("is-folding");
      syncFaces();
      clearTimeout(timer);
      timer = window.setTimeout(finishFold, reducedMotion.matches ? 40 : 1750);
    }

    function finishUnfold() {
      folded = false;
      animating = false;
      folder.classList.remove("is-unfolding", "is-folded", "is-folding");
      syncFaces();
    }

    function unfoldFolder() {
      if (!folded || animating) return;
      animating = true;
      folder.classList.remove("is-folding");
      folder.classList.add("is-unfolding");
      syncFaces();
      clearTimeout(timer);
      timer = window.setTimeout(finishUnfold, reducedMotion.matches ? 40 : 1750);
    }

    function toggleFolder() {
      if (folded) unfoldFolder();
      else foldFolder();
    }

    folder.addEventListener("click", toggleFolder);
    folder.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFolder();
      }
    });

    flipButton?.addEventListener("click", event => {
      event.stopPropagation();
      if (animating) return;
      flipped = !flipped;
      syncFaces();
    });

    syncFaces();
  }

  document.querySelectorAll("[data-mp-flip]").forEach(card => {
    const button = card.querySelector(".mp-flip-button");
    const scene = card.querySelector(".mp-flip-scene");
    let flipped = false;

    const update = () => {
      card.classList.toggle("is-flipped", flipped);
      button?.setAttribute("aria-pressed", String(flipped));
      if (button) button.textContent = flipped ? "front" : "flip";
    };

    const flip = () => {
      flipped = !flipped;
      update();
    };

    button?.addEventListener("click", event => {
      event.stopPropagation();
      flip();
    });

    scene?.addEventListener("click", flip);
    scene?.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        flip();
      }
    });

    update();
  });

  document.querySelectorAll("[data-flyer]").forEach(flyer => {
    const button = flyer.querySelector(".flyer-flip");
    const state = flyer.querySelector(".flyer-state");
    const scene = flyer.querySelector(".flyer-scene");
    let flipped = false;

    const update = () => {
      flyer.classList.toggle("is-flipped", flipped);
      button?.setAttribute("aria-pressed", String(flipped));
      if (button) button.textContent = flipped ? "front" : "flip";
      if (state) state.textContent = flipped ? "reverse" : "front";
    };

    const flip = () => {
      flipped = !flipped;
      update();
    };

    button?.addEventListener("click", event => {
      event.stopPropagation();
      flip();
    });

    scene?.addEventListener("click", flip);
    scene?.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        flip();
      }
    });

    update();
  });
})();
