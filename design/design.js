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
    plus?.addEventListener("click", () => setProjectState(project, !project.classList.contains("is-open")));
    explore?.addEventListener("click", () => setProjectState(project, true));
    close?.addEventListener("click", () => {
      setProjectState(project, false);
      project.querySelector(".project-summary")?.scrollIntoView({behavior: reducedMotion.matches ? "auto" : "smooth", block:"start"});
    });
  });

  document.querySelectorAll("[data-media-switcher]").forEach(switcher => {
    const toggle = switcher.querySelector(".media-switcher-toggle");
    const stage = switcher.querySelector(".media-switcher-stage");
    const flip = () => {
      const secondary = switcher.classList.toggle("is-secondary");
      toggle?.setAttribute("aria-pressed", String(secondary));
    };
    toggle?.addEventListener("click", e => { e.stopPropagation(); flip(); });
    if (stage) {
      stage.tabIndex = 0;
      stage.setAttribute("role","button");
      stage.setAttribute("aria-label","Switch between artwork and installed view");
      stage.addEventListener("click", flip);
      stage.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    }
  });

  const foldout = document.querySelector("[data-foldout]");
  if (foldout) {
    const project = foldout.closest(".project");
    const sideButton = project?.querySelector(".foldout-side");
    const stateLabel = project?.querySelector(".foldout-state");
    const flat = foldout.querySelector(".foldout-flat-reference");
    let folded = false;
    let inside = false;
    let timer = null;

    const update = () => {
      const src = inside ? "assets/better angels takeaway inside.png" : "assets/better angels takeaway outside.png";
      if (flat) {
        flat.src = src;
        flat.alt = `Better Angels takeaway folder shown flat, ${inside ? "inside" : "outside"}`;
      }
      foldout.classList.toggle("show-inside", inside);
      foldout.setAttribute("aria-pressed", String(folded));
      if (stateLabel) stateLabel.textContent = folded ? "closed" : `${inside ? "inside" : "outside"} / open`;
      if (sideButton) {
        sideButton.textContent = inside ? "view outside" : "view inside";
        sideButton.setAttribute("aria-pressed", String(inside));
        sideButton.disabled = folded || foldout.classList.contains("is-folding");
      }
    };

    const closeFolder = () => {
      if (folded || foldout.classList.contains("is-folding")) return;
      inside = false;
      update();
      foldout.classList.add("is-folding");
      clearTimeout(timer);
      timer = setTimeout(() => {
        foldout.classList.remove("is-folding");
        foldout.classList.add("is-folded");
        folded = true;
        update();
      }, 760);
    };

    const openFolder = () => {
      if (!folded || foldout.classList.contains("is-folding")) return;
      foldout.classList.remove("is-folded");
      foldout.classList.add("is-folding");
      folded = false;
      update();
      clearTimeout(timer);
      timer = setTimeout(() => { foldout.classList.remove("is-folding"); update(); }, 620);
    };

    const toggleFolder = () => folded ? openFolder() : closeFolder();
    foldout.addEventListener("click", toggleFolder);
    foldout.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFolder(); } });
    sideButton?.addEventListener("click", e => { e.stopPropagation(); if (!folded && !foldout.classList.contains("is-folding")) { inside = !inside; update(); } });
    update();
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
    const flip = () => { flipped = !flipped; update(); };
    button?.addEventListener("click", flip);
    scene?.addEventListener("click", flip);
    scene?.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    update();
  });
})();
