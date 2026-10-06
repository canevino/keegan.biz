(() => {
  "use strict";

  const projects =
    document.querySelectorAll(".project");

  if (!projects.length) {
    return;
  }


  function setProjectState(project, open) {
    const content =
      project.querySelector(".project-content");

    const plus =
      project.querySelector(".project-plus");

    const explore =
      project.querySelector(".project-explore");

    if (!content) {
      return;
    }

    content.hidden = !open;

    project.classList.toggle(
      "is-open",
      open
    );

    if (plus) {
      plus.setAttribute(
        "aria-expanded",
        String(open)
      );

      plus.textContent =
        open
          ? "—"
          : "+";
    }

    if (explore) {
      explore.setAttribute(
        "aria-expanded",
        String(open)
      );
    }
  }


  projects.forEach(project => {
    const plus =
      project.querySelector(".project-plus");

    const explore =
      project.querySelector(".project-explore");

    const close =
      project.querySelector(".project-close");


    if (plus) {
      plus.addEventListener(
        "click",
        () => {
          const open =
            project.classList.contains("is-open");

          setProjectState(
            project,
            !open
          );
        }
      );
    }


    if (explore) {
      explore.addEventListener(
        "click",
        () => {
          setProjectState(
            project,
            true
          );
        }
      );
    }


    if (close) {
      close.addEventListener(
        "click",
        () => {
          setProjectState(
            project,
            false
          );

          const summary =
            project.querySelector(".project-summary");

          if (summary) {
            summary.scrollIntoView({
              behavior:
                window.matchMedia(
                  "(prefers-reduced-motion: reduce)"
                ).matches
                  ? "auto"
                  : "smooth",
              block: "start"
            });
          }
        }
      );
    }
  });



  const mediaSwitchers =
    document.querySelectorAll(
      "[data-media-switcher]"
    );

  mediaSwitchers.forEach(switcher => {
    const toggle =
      switcher.querySelector(
        ".media-switcher-toggle"
      );

    const stage =
      switcher.querySelector(
        ".media-switcher-stage"
      );


    function toggleMedia() {
      const secondary =
        switcher.classList.toggle(
          "is-secondary"
        );

      if (toggle) {
        toggle.setAttribute(
          "aria-pressed",
          String(secondary)
        );
      }
    }


    if (toggle) {
      toggle.addEventListener(
        "click",
        toggleMedia
      );
    }


    if (stage) {
      stage.setAttribute(
        "tabindex",
        "0"
      );

      stage.setAttribute(
        "role",
        "button"
      );

      stage.setAttribute(
        "aria-label",
        "Switch between installed view and artwork"
      );

      stage.addEventListener(
        "click",
        toggleMedia
      );

      stage.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            toggleMedia();
          }
        }
      );
    }
  });
      );
    }


    if (sideButton) {
      sideButton.addEventListener(
        "click",
        () => {
          inside = !inside;
          refreshFoldout();
        }
      );
    }


    refreshFoldout();
  }




  const foldout =
    document.querySelector(
      "[data-foldout]"
    );

  if (foldout) {
    const project =
      foldout.closest(
        ".project"
      );

    const foldButton =
      project
        ? project.querySelector(
            ".foldout-fold"
          )
        : null;

    const sideButton =
      project
        ? project.querySelector(
            ".foldout-side"
          )
        : null;

    const stateLabel =
      project
        ? project.querySelector(
            ".foldout-state"
          )
        : null;

    const flatReference =
      foldout.querySelector(
        ".foldout-flat-reference"
      );

    const panelImages =
      foldout.querySelectorAll(
        ".fold-panel img"
      );

    let step = 0;
    let inside = false;


    function currentImage() {
      return inside
        ? "assets/better angels takeaway inside.png"
        : "assets/better angels takeaway outside.png";
    }


    function refreshFoldout() {
      const image =
        currentImage();

      panelImages.forEach(img => {
        img.src = image;
      });

      if (flatReference) {
        flatReference.src = image;

        flatReference.alt =
          `Better Angels takeaway folder shown flat, ${
            inside
              ? "inside"
              : "outside"
          }`;
      }

      foldout.dataset.step =
        String(step);


      if (sideButton) {
        sideButton.textContent =
          inside
            ? "view outside"
            : "view inside";

        sideButton.setAttribute(
          "aria-pressed",
          String(inside)
        );
      }


      if (foldButton) {
        if (step === 0) {
          foldButton.textContent =
            "fold sides";
        } else if (step === 1) {
          foldButton.textContent =
            "fold lower panel";
        } else {
          foldButton.textContent =
            "unfold";
        }

        foldButton.setAttribute(
          "aria-pressed",
          String(step > 0)
        );
      }


      if (stateLabel) {
        const state =
          step === 0
            ? "flat"
            : step === 1
              ? "sides folded"
              : "folded";

        stateLabel.textContent =
          `${state} / ${
            inside
              ? "inside"
              : "outside"
          }`;
      }
    }


    if (sideButton) {
      sideButton.addEventListener(
        "click",
        () => {
          inside = !inside;
          refreshFoldout();
        }
      );
    }


    if (foldButton) {
      foldButton.addEventListener(
        "click",
        () => {
          step =
            step === 0
              ? 1
              : step === 1
                ? 2
                : 0;

          refreshFoldout();
        }
      );
    }


    foldout.setAttribute(
      "tabindex",
      "0"
    );

    foldout.setAttribute(
      "aria-label",
      "Interactive Better Angels takeaway folder"
    );

    foldout.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          step =
            step === 0
              ? 1
              : step === 1
                ? 2
                : 0;

          refreshFoldout();
        }
      }
    );


    refreshFoldout();
  }


})();
