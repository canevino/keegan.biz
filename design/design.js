(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");

  // Make the visual stages work by mouse, touch, and keyboard.
  function activate(element, action) {
    if (!element) return;
    element.addEventListener("click", action);
    if (element.matches("button, a")) return;
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    });
  }

  // Expandable project studies.
  document.querySelectorAll("[data-project]").forEach((project) => {
    const content = project.querySelector(".project-content");
    const toggle = project.querySelector(".project-toggle");
    if (!content || !toggle) return;

    function setOpen(open) {
      project.classList.toggle("is-open", open);
      content.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      const symbol = toggle.querySelector(".project-toggle__symbol");
      if (symbol) symbol.textContent = open ? "−" : "+";

      if (open) {
        if (!reducedMotion.matches) {
          content.animate(
            [{ opacity: 0, transform: "translateY(10px)" },
             { opacity: 1, transform: "translateY(0)" }],
            { duration: 220, easing: "ease-out" }
          );
        }
      }
    }

    project.classList.remove("is-open");
    content.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => setOpen(!project.classList.contains("is-open")));
  });

  // Artwork / installed photograph switchers.
  document.querySelectorAll("[data-switcher]").forEach((switcher) => {
    const button = switcher.querySelector(".image-switcher__button");
    const stage = switcher.querySelector(".image-switcher__stage");
    const primary = switcher.querySelector(".state-primary");
    const secondary = switcher.querySelector(".state-secondary");

    function sync() {
      const changed = switcher.classList.contains("is-secondary");
      primary?.setAttribute("aria-hidden", String(changed));
      secondary?.setAttribute("aria-hidden", String(!changed));
      if (button) {
        button.textContent = changed ? "artwork" : "in use";
        button.setAttribute("aria-pressed", String(changed));
      }
    }
    function toggle() {
      switcher.classList.toggle("is-secondary");
      sync();
    }

    button?.addEventListener("click", toggle);
    activate(stage, toggle);
    stage?.addEventListener("pointerenter", () => {
      if (hoverCapable.matches) switcher.classList.add("is-hover-secondary");
    });
    stage?.addEventListener("pointerleave", () => switcher.classList.remove("is-hover-secondary"));
    sync();
  });

  // Two-sided printed pieces.
  document.querySelectorAll("[data-flip-card]").forEach((card) => {
    const button = card.querySelector(".flip-card__button");
    const stage = card.querySelector(".flip-card__scene");

    function toggle() {
      const flipped = card.classList.toggle("is-flipped");
      button?.setAttribute("aria-pressed", String(flipped));
    }
    button?.addEventListener("click", toggle);
    activate(stage, toggle);

    // Only the Triennial's print cards have a temporary hover preview.
    if (card.closest("#project-triennial")) {
      stage?.addEventListener("pointerenter", () => {
        if (hoverCapable.matches) card.classList.add("is-hover-flipped");
      });
      stage?.addEventListener("pointerleave", () => card.classList.remove("is-hover-flipped"));
    }
  });

  // Better Angels folding paper model.
  document.querySelectorAll("[data-folder]").forEach((folder) => {
    const flipButton = folder.querySelector(".folder-flip");
    const foldButton = folder.querySelector(".folder-fold");
    const stage = folder.querySelector(".folder-stage");
    const paper = folder.querySelector(".paper-folder");
    if (!flipButton || !foldButton || !stage || !paper) return;

    let folded = false;
    let flipped = false;
    function sync() {
      folder.classList.toggle("is-folded", folded);
      folder.classList.toggle("is-flipped", flipped);
      paper.dataset.side = flipped ? "inside" : "outside";
      flipButton.textContent = flipped ? "outside" : "inside";
      foldButton.textContent = folded ? "unfold" : "fold";
      flipButton.setAttribute("aria-pressed", String(flipped));
      foldButton.setAttribute("aria-pressed", String(folded));
      stage.setAttribute("aria-pressed", String(folded));
      stage.setAttribute("aria-label", `Better Angels paper takeaway, ${folded ? "folded" : "unfolded"}, showing ${flipped ? "inside" : "outside"}. Activate to ${folded ? "unfold" : "fold"}.`);
    }

    flipButton.addEventListener("click", () => { flipped = !flipped; sync(); });
    foldButton.addEventListener("click", () => { folded = !folded; sync(); });
    activate(stage, () => { folded = !folded; sync(); });
    sync();
  });

  // Show the work-in-progress notice once per tab/session.
  const dialog = document.getElementById("wip-dialog");
  const storageKey = "keegan-biz-design-wip-dismissed";
  let dismissed = false;
  try { dismissed = sessionStorage.getItem(storageKey) === "1"; } catch (_) {}

  if (dialog && typeof dialog.showModal === "function" && !dismissed) {
    dialog.querySelector("[data-wip-dismiss]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      try { sessionStorage.setItem(storageKey, "1"); } catch (_) {}

    });
    dialog.showModal();
  }
})();
