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
})();
