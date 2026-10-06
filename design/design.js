(() => {
  "use strict";

  const toggles =
    document.querySelectorAll(
      ".project-toggle"
    );

  if (!toggles.length) {
    return;
  }


  toggles.forEach(toggle => {

    toggle.addEventListener(
      "click",
      () => {

        const project =
          toggle.closest(
            ".project"
          );

        if (!project) {
          return;
        }


        const contentId =
          toggle.getAttribute(
            "aria-controls"
          );

        const content =
          contentId
            ? document.getElementById(
                contentId
              )
            : null;

        const symbol =
          toggle.querySelector(
            ".project-symbol"
          );

        if (!content) {
          return;
        }


        const isOpen =
          toggle.getAttribute(
            "aria-expanded"
          ) === "true";


        toggle.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );


        content.hidden =
          isOpen;


        project.classList.toggle(
          "is-open",
          !isOpen
        );


        if (symbol) {
          symbol.textContent =
            isOpen
              ? "+"
              : "—";
        }

      }
    );

  });

})();
