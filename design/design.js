(() => {
  "use strict";

  const controls =
    document.querySelectorAll(
      ".project-plus, .project-explore"
    );

  if (!controls.length) {
    return;
  }


  function setProjectState(project, open) {

    const content =
      project.querySelector(
        ".project-content"
      );

    const plus =
      project.querySelector(
        ".project-plus"
      );

    const explore =
      project.querySelector(
        ".project-explore"
      );

    if (!content) {
      return;
    }


    content.hidden =
      !open;


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

      explore.textContent =
        open
          ? "close"
          : "explore";
    }

  }


  controls.forEach(control => {

    control.addEventListener(
      "click",
      () => {

        const project =
          control.closest(
            ".project"
          );

        if (!project) {
          return;
        }


        const isOpen =
          project.classList.contains(
            "is-open"
          );


        setProjectState(
          project,
          !isOpen
        );

      }
    );

  });

})();
