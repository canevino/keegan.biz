(() => {
  "use strict";

  const nav = document.querySelector("[data-site-nav]");

  if (!nav) {
    return;
  }

  const path = window.location.pathname;

  function isCurrent(href) {
    if (href === "/") {
      return path === "/" || path.endsWith("/index.html");
    }

    return path.startsWith(href);
  }

  const items = [
    {
      label: "Home",
      href: "/",
      image: "/assets/home/home-scarf-update.png",
      className: "scarf-home",
      live: true
    },
    {
      label: "Illustration",
      href: "/illustration/",
      image: "/assets/home/scarf-illustration.png",
      live: true
    },
    {
      label: "Photography",
      href: "/photography/",
      image: "/assets/home/scarf-photography.png",
      live: true
    },
    {
  label: "Graphic Design",
  href: "/design/",
  image: "/assets/home/scarf-design.png",
  live: true
},
    {
      label: "Music",
      href: "#",
      image: "/assets/home/scarf-music.png",
      live: false
    },
    {
      label: "Motion",
      href: "/motion/",
      image: "/assets/home/scarf-motion.png",
      live: true
    },
    {
      label: "Miscellaneous",
      href: "#",
      image: "/assets/home/scarf-misc.png",
      live: false
    },
    {
      label: "Gastronomy",
      href: "#",
      image: "/assets/home/scarf-gastronomy.png",
      live: false
    }
  ];

  nav.classList.add("scarf-rack");
  nav.setAttribute("aria-label", "Sections");

  nav.innerHTML = items
    .map(item => {
      const current = item.live && isCurrent(item.href);
      const classes = [
        "scarf-item",
        item.className || ""
      ]
        .filter(Boolean)
        .join(" ");

      const liveAttr =
        item.live
          ? " data-live-link"
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
    })
    .join("");

  let overlay = document.getElementById("wip-overlay");
  let audio = document.getElementById("wip-audio");
  let closeButton = document.getElementById("wip-close");
  let stage = document.getElementById("collage-stage");

  if (!overlay) {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <audio id="wip-audio" preload="auto">
        <source
          src="/assets/home/crickets.mp3"
          type="audio/mpeg"
        >
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
      document.body.appendChild(wrapper.firstChild);
    }

    overlay = document.getElementById("wip-overlay");
    audio = document.getElementById("wip-audio");
    closeButton = document.getElementById("wip-close");
    stage = document.getElementById("collage-stage");
  }

  let revealTimer = null;

  function openWip() {
    if (!overlay) {
      return;
    }

    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");

    if (stage) {
      stage.classList.remove("is-revealed");
    }

    if (revealTimer) {
      window.clearTimeout(revealTimer);
    }

    revealTimer = window.setTimeout(() => {
      if (stage) {
        stage.classList.add("is-revealed");
      }
    }, 12000);

    if (audio) {
      audio.pause();
      audio.currentTime = 0;

      const promise = audio.play();

      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    }
  }

  function closeWip() {
    if (!overlay) {
      return;
    }

    if (revealTimer) {
      window.clearTimeout(revealTimer);
      revealTimer = null;
    }

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (stage) {
      stage.classList.remove("is-revealed");
    }

    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
  }

  nav.addEventListener("click", event => {
    const link = event.target.closest("a");

    if (
      !link ||
      link.hasAttribute("data-live-link")
    ) {
      return;
    }

    event.preventDefault();
    openWip();
  });

  if (closeButton) {
    closeButton.addEventListener("click", closeWip);
  }

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      overlay &&
      overlay.classList.contains("is-visible")
    ) {
      closeWip();
    }
  });
})();
