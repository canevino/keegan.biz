(() => {
  "use strict";

  const projects =
    document.querySelectorAll(
      ".project"
    );

  if (!projects.length) {
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
        "explore";
    }
  }


  projects.forEach(project => {
    const plus =
      project.querySelector(
        ".project-plus"
      );

    const explore =
      project.querySelector(
        ".project-explore"
      );

    const close =
      project.querySelector(
        ".project-close"
      );


    if (plus) {
      plus.addEventListener(
        "click",
        () => {
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
            project.querySelector(
              ".project-summary"
            );

          if (summary) {
            summary.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        }
      );
    }
  });

})();
