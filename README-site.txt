KEEGAN.BIZ — SITE FRAMEWORK NOTES

Purpose

This is a personal site, not a conventional portfolio template. The structure stays simple so the artwork, scans, photographs, video, sound, and page-specific interactions can carry the personality.

Main visual system

Background / paper:
#ECE7D7

Ink:
#11110F

Yellow:
#FDB913

Green:
#006A44

Red:
#C1272D

Default type:
Helvetica, Arial, sans-serif

General type behavior:
- mostly lowercase
- bold display text
- tight letter spacing
- short line heights
- hard edges
- very little decorative UI
- page-specific artwork supplies most of the visual character

Main folders

/
  index.html
  style.css

/assets/
  home/
  site-nav.js

/photography/
  index.html
  style.css
  assets/

/illustration/
  index.html
  style.css
  illustration assets

/motion/
  index.html
  style.css
  assets/

/design/
  index.html
  design.css
  design.js
  assets/

Other section URLs:
  /music/
  /misc/
  /gastronomy/

Those sections may still be unfinished. Do not document them as complete until they are actually built.

Navigation

The navigation system has changed over time.

Homepage:
- uses the scarf-based navigation system
- each scarf represents a section
- desktop = vertical rack on the right
- mobile = horizontal scrolling rack at the top

Current design page:
- only keegan.biz remains a scarf
- the other section links are text
- the shared navigation data lives in /assets/site-nav.js
- live pages use their real href
- unfinished pages open the WIP overlay instead

Important:
Do not assume every page uses exactly the same navigation markup. The shared labels and destinations should stay consistent, but some pages intentionally have their own treatment.

WIP overlay

Unfinished links can open a site-wide unfinished-page overlay.

Current simplified version:
- cream background
- message
- close X
- crickets audio
- original horse.gif
- horse is invisible at first
- starts fading in at about 12 seconds
- reaches full opacity around 20 seconds
- then continues looping normally
- no old texture collage
- no duplicate horse
- no color cycling
- no grain
- no later transformation

Closing the WIP:
- pauses the cricket audio
- resets the audio to 0
- hides the horse again
- restores the page

On the photography page, opening the WIP also temporarily mutes the generative photography audio.

General mobile rules

- avoid loading every large asset immediately
- use lazy loading where possible
- keep the main content usable with normal vertical scrolling
- reduce the number of active image layers on heavy pages
- avoid hover-only interaction
- use touch wording where appropriate
- do not make the mobile version a completely different visual identity

General coding rules

- keep page logic inside that page unless there is a real reason to make it shared
- avoid creating new JS files just to reorganize working code
- preserve working page behavior when changing one component
- full replacement files are easier to manage than small patches
- keep asset paths relative to the page folder
- be careful with GitHub Pages paths
- use data-live-link on links that should navigate normally when a page also has WIP interception logic

Performance

Main performance risks are image memory and decoded audio, not JavaScript size.

Heavy pages should:
- preload only the main image
- lazy-load secondary images
- limit simultaneously active Web Audio voices
- stream long audio when possible
- avoid decoding large desktop-resolution images unnecessarily on mobile
- keep gallery JPEGs web-sized

Before replacing a working file:
- check all asset paths
- check mobile behavior
- check WIP links
- check JavaScript syntax
- check that unrelated interactions are still present
