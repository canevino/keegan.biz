(() => {
  "use strict";

  const nav =
    document.querySelector(
      "[data-site-nav]"
    );

  if (!nav) {
    return;
  }

  const path =
    window.location.pathname;

  function isCurrent(
    href
  ) {
    if (href === "/") {
      return (
        path === "/" ||
        path.endsWith("/index.html")
      );
    }

    return path.startsWith(
      href
    );
  }

  const items = [
    {
      label:
        "Home",

      href:
        "/",

      image:
        "/assets/home/home-scarf-update.png",

      className:
        "scarf-home",

      live:
        true
    },

    {
      label:
        "Illustration",

      href:
        "/illustration/",

      image:
        "/assets/home/scarf-illustration.png",

      live:
        true
    },

    {
      label:
        "Photography",

      href:
        "/photography/",

      image:
        "/assets/home/scarf-photography.png",

      live:
        true
    },

    {
      label:
        "Graphic Design",

      href:
        "#",

      image:
        "/assets/home/scarf-design.png",

      live:
        false
    },

    {
      label:
        "Music",

      href:
        "#",

      image:
        "/assets/home/scarf-music.png",

      live:
        false
    },

    {
      label:
        "Motion",

      href:
        "/motion/",

      image:
        "/assets/home/scarf-motion.png",

      live:
        true
    },

    {
      label:
        "Miscellaneous",

      href:
        "#",

      image:
        "/assets/home/scarf-misc.png",

      live:
        false
    },

    {
      label:
        "Gastronomy",

      href:
        "#",

      image:
        "/assets/home/scarf-gastronomy.png",

      live:
        false
    }
  ];

  nav.classList.add(
    "scarf-rack"
  );

  nav.setAttribute(
    "aria-label",
    "Sections"
  );

  nav.innerHTML =
    items
      .map(
        item => {
          const current =
            item.live &&
            isCurrent(
              item.href
            );

          const classes = [
            "scarf-item",
            item.className || ""
          ]
            .filter(Boolean)
            .join(" ");

          const liveAttr =
            item.live
              ? ' data-live-link'
              : "";

          const currentAttr =
            current
              ? ' aria-current="page"'
              : "";

          return `
            <a
              class="${classes}"
              href="${item.href}"
              aria-label="${item.label}"
              ${liveAttr}
              ${currentAttr}
            >
              <img
                src="${item.image}"
                alt=""
              >
            </a>
          `;
        }
      )
      .join("");


  function setupWipOverlay() {
    if (document.getElementById("wip-overlay")) {
      return;
    }

    const pageShell =
      document.getElementById("page-shell");

    if (!pageShell) {
      return;
    }

    const wrapper =
      document.createElement("div");

    wrapper.innerHTML = `
      <audio id="wip-audio" preload="auto">
        <source src="/assets/home/crickets.mp3" type="audio/mpeg">
      </audio>

      <div
        class="wip-overlay"
        id="wip-overlay"
        aria-hidden="true"
      >
        <div class="wip-inner">
          <div class="wip-header">
            <p class="wip-text">
              sorry, i'm still working on this page.
            </p>

            <button
              class="wip-close"
              id="wip-close"
              type="button"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div
            class="collage-stage"
            id="collage-stage"
            aria-hidden="true"
          >
            <img
              class="horse horse-main"
              src="/assets/home/horse.gif"
              alt=""
            >
          </div>
        </div>
      </div>
    `;

    while (wrapper.firstChild) {
      document.body.appendChild(
        wrapper.firstChild
      );
    }

    const overlay =
      document.getElementById("wip-overlay");

    const audio =
      document.getElementById("wip-audio");

    const closeButton =
      document.getElementById("wip-close");

    const stage =
      document.getElementById("collage-stage");

    let revealTimer = null;

    function openWip() {
      pageShell.classList.add("is-hidden");

      overlay.classList.add("is-visible");
      overlay.setAttribute(
        "aria-hidden",
        "false"
      );

      stage.classList.remove("is-revealed");

      if (revealTimer) {
        window.clearTimeout(
          revealTimer
        );
      }

      revealTimer =
        window.setTimeout(
          () => {
            stage.classList.add("is-revealed");
          },
          12000
        );

      if (audio) {
        audio.pause();
        audio.currentTime = 0;

        const playPromise =
          audio.play();

        if (
          playPromise &&
          typeof playPromise.catch ===
          "function"
        ) {
          playPromise.catch(
            () => {}
          );
        }
      }
    }

    function closeWip() {
      if (revealTimer) {
        window.clearTimeout(
          revealTimer
        );

        revealTimer =
          null;
      }

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      stage.classList.remove("is-revealed");

      overlay.classList.remove("is-visible");
      overlay.setAttribute(
        "aria-hidden",
        "true"
      );

      window.setTimeout(
        () => {
          pageShell.classList.remove("is-hidden");
        },
        160
      );
    }

    nav.addEventListener(
      "click",
      event => {
        const link =
          event.target.closest(
            "a"
          );

        if (
          !link ||
          link.hasAttribute(
            "data-live-link"
          )
        ) {
          return;
        }

        event.preventDefault();
        openWip();
      }
    );

    closeButton.addEventListener(
      "click",
      closeWip
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape" &&
          overlay.classList.contains(
            "is-visible"
          )
        ) {
          closeWip();
        }
      }
    );
  }

  setupWipOverlay();

})();
