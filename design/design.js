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
    const sideButton = project?.querySelector(".ba-folder-side");
    const stateLabel = project?.querySelector(".ba-folder-state");
    const flat = folder.querySelector(".ba-folder-flat");
    const panelImages = folder.querySelectorAll(".ba-folder-panel img");
    const closedImage = folder.querySelector(".ba-folder-closed-face img");

    let inside = false;
    let closed = false;
    let animating = false;
    let timer = null;

    const source = () => inside
      ? "assets/better angels takeaway inside.png"
      : "assets/better angels takeaway outside.png";

    function syncArtwork() {
      const src = source();

      if (flat) {
        flat.src = src;
        flat.alt = `Better Angels takeaway folder shown flat, ${inside ? "inside" : "outside"}`;
      }

      panelImages.forEach(image => {
        image.src = src;
      });

      if (closedImage) {
        closedImage.src = "assets/better angels takeaway outside.png";
      }

      sideButton?.setAttribute("aria-pressed", String(inside));
      if (sideButton) {
        sideButton.textContent = inside ? "view outside" : "view inside";
        sideButton.disabled = closed || animating;
      }

      folder.setAttribute("aria-pressed", String(closed));
      if (stateLabel) {
        stateLabel.textContent = closed ? "closed" : `${inside ? "inside" : "outside"} / open`;
      }
    }

    function finishClose() {
      folder.classList.remove("is-closing");
      folder.classList.add("is-closed");
      closed = true;
      animating = false;
      syncArtwork();
    }

    function closeFolder() {
      if (closed || animating) return;

      inside = false;
      animating = true;
      syncArtwork();
      folder.classList.remove("is-opening", "is-opening-active");
      folder.classList.add("is-closing");

      clearTimeout(timer);
      timer = window.setTimeout(finishClose, reducedMotion.matches ? 40 : 720);
    }

    function finishOpen() {
      folder.classList.remove("is-opening", "is-opening-active");
      closed = false;
      animating = false;
      syncArtwork();
    }

    function openFolder() {
      if (!closed || animating) return;

      animating = true;
      folder.classList.remove("is-closed");
      folder.classList.add("is-opening");

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          folder.classList.add("is-opening-active");
        });
      });

      clearTimeout(timer);
      timer = window.setTimeout(finishOpen, reducedMotion.matches ? 40 : 620);
    }

    function toggleFolder() {
      if (closed) openFolder();
      else closeFolder();
    }

    folder.addEventListener("click", toggleFolder);
    folder.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFolder();
      }
    });

    sideButton?.addEventListener("click", event => {
      event.stopPropagation();
      if (closed || animating) return;
      inside = !inside;
      syncArtwork();
    });

    syncArtwork();
  }

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
