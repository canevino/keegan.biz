(() => {
  'use strict';
  const projects = window.DESIGN_PORTFOLIO || [];
  if (!projects.length) return;

  const byId = id => document.getElementById(id);
  const overview = byId('overview');
  const study = byId('study');
  const index = byId('work-index');
  const gallery = byId('project-gallery');
  const featureImage = byId('feature-image');
  const featureDescription = byId('feature-description');
  const dialog = byId('art-dialog');
  const dialogImage = byId('art-dialog-image');
  const dialogCaption = byId('art-dialog-caption');

  let previewIndex = 0;
  let projectIndex = -1;
  let slideIndex = 0;
  let activeGroups = [];
  let groupSize = 2;
  let lightboxIndex = -1;
  let lightboxItems = [];
  let resizeTick = null;

  function el(tag, className = '', text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, action, className = '') {
    const node = el('button', className, label);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }
  function picture(src, alt, eager = false) {
    const img = el('img');
    img.src = src;
    img.alt = alt || '';
    img.decoding = 'async';
    img.loading = eager ? 'eager' : 'lazy';
    return img;
  }

  function showPreview(i) {
    previewIndex = i;
    const project = projects[i];
    featureImage.src = project.cover;
    featureImage.alt = project.tagline;
    featureDescription.textContent = project.tagline;
    byId('feature-open').setAttribute('aria-label', `Open ${project.name}`);
    index.querySelectorAll('.work-item').forEach((node, j) => {
      node.classList.toggle('is-active', j === i);
      if (j === i) node.setAttribute('aria-current', 'true');
      else node.removeAttribute('aria-current');
    });
  }

  projects.forEach((project, i) => {
    const item = button('', () => openProject(i), 'work-item');
    item.classList.add(`work-item--${project.id}`);
    item.append(el('span', '', project.name), el('span', 'work-mark', '+'));
    item.querySelector('.work-mark').setAttribute('aria-hidden', 'true');
    item.addEventListener('mouseenter', () => {
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) showPreview(i);
    });
    item.addEventListener('focus', () => showPreview(i));
    index.append(item);
  });
  byId('feature-open').addEventListener('click', () => openProject(previewIndex));
  byId('feature-action').addEventListener('click', () => openProject(previewIndex));

  function registerLightbox(src, alt, title) {
    if (!lightboxItems.some(item => item.src === src)) lightboxItems.push({src, alt, title});
  }
  function showLightboxImage() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    dialogImage.onload = null;
    dialogImage.style.maxWidth = '';
    dialogImage.style.maxHeight = '';
    dialogImage.src = item.src;
    dialogImage.alt = item.alt || item.title;
    dialogCaption.textContent = item.title;
    const syncSize = () => {
      if (dialogImage.src !== new URL(item.src, document.baseURI).href) return;
      if (!dialogImage.naturalWidth) return;
      dialogImage.style.maxWidth = `${dialogImage.naturalWidth}px`;
      dialogImage.style.maxHeight = `${dialogImage.naturalHeight}px`;
    };
    if (dialogImage.complete && dialogImage.naturalWidth) syncSize();
    else dialogImage.onload = syncSize;
    byId('art-dialog-prev').disabled = lightboxIndex <= 0;
    byId('art-dialog-next').disabled = lightboxIndex >= lightboxItems.length - 1;
  }
  function openLarge(src, alt, title) {
    if (!src || !dialog?.showModal) return;
    let match = lightboxItems.findIndex(item => item.src === src);
    if (match < 0) {
      registerLightbox(src, alt, title || alt || 'Artwork');
      match = lightboxItems.length - 1;
    }
    lightboxIndex = match;
    showLightboxImage();
    if (!dialog.open) dialog.showModal();
  }
  function moveLightbox(direction) {
    const next = lightboxIndex + direction;
    if (next < 0 || next >= lightboxItems.length) return;
    lightboxIndex = next;
    showLightboxImage();
  }
  byId('art-dialog-prev').addEventListener('click', () => moveLightbox(-1));
  byId('art-dialog-next').addEventListener('click', () => moveLightbox(1));
  byId('art-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { dialogImage.removeAttribute('src'); dialogImage.onload = null; });

  // Keep the original fold prototype and source files. Its folding geometry can
  // be revisited independently, without changing the rest of the gallery.
  function makeFoldout() {
    const outside = '/design/assets/better%20angels%20takeaway%20outside.png';
    const inside = '/design/assets/better%20angels%20takeaway%20inside.png';
    let folded = false;
    let flipped = false;
    const view = el('div', 'folder-view');
    const stage = button('', () => { folded = !folded; sync(); }, 'folder-stage');
    const flat = picture(outside, 'Better Angels takeaway laid flat');
    flat.className = 'folder-flat';
    const model = el('div', 'paper-folder');
    model.setAttribute('aria-hidden', 'true');
    for (const part of ['center', 'tongue', 'left', 'right']) {
      const pane = el('div', `folder-panel folder-panel--${part}`);
      pane.append(el('div', 'folder-panel__face folder-panel__face--front folder-art--outside'),
                  el('div', 'folder-panel__face folder-panel__face--back folder-art--inside'));
      model.append(pane);
    }
    stage.append(flat, model);
    const actions = el('div', 'slide-actions');
    const fold = button('fold', () => { folded = !folded; sync(); }, 'text-action');
    const flip = button('inside', () => { flipped = !flipped; sync(); }, 'text-action');
    actions.append(fold, flip);
    function sync() {
      view.classList.toggle('is-folded', folded);
      view.classList.toggle('is-flipped', flipped);
      flat.src = flipped ? inside : outside;
      flat.alt = `Better Angels takeaway ${flipped ? 'inside' : 'outside'}`;
      fold.textContent = folded ? 'unfold' : 'fold';
      flip.textContent = flipped ? 'outside' : 'inside';
      fold.setAttribute('aria-pressed', String(folded));
      flip.setAttribute('aria-pressed', String(flipped));
      stage.setAttribute('aria-pressed', String(folded));
      stage.setAttribute('aria-label', folded ? 'Unfold paper takeaway' : 'Fold paper takeaway');
    }
    sync();
    view.append(stage);
    return {node: view, actions};
  }

  // Each carousel stop is a group of related works. The next group stays
  // partly visible to indicate horizontal browsing.
  function renderArtwork(entry, i) {
    const item = entry.item;
    const figure = el('figure', 'viewer-artwork');
    const frame = el('div', 'viewer-image-frame');
    const actions = el('div', 'slide-actions');
    const alt = item.alt || item.title;

    if (item.type === 'image') {
      frame.append(picture(item.src, alt, i < 2));
      registerLightbox(item.src, alt, item.title);
      actions.append(button('enlarge', () => openLarge(item.src, alt, item.title), 'text-action'));
    } else if (item.type === 'switch' || item.type === 'flip') {
      let pinned = false;
      frame.classList.add('has-reverse', `has-reverse--${item.type}`);
      registerLightbox(item.front, alt, item.title);
      registerLightbox(item.back, `${item.title}, reverse or in use`, item.title);
      if (item.type === 'switch') {
        const front = picture(item.front, alt, i < 2);
        const back = picture(item.back, `${item.title}, in use`);
        front.className = 'state-primary';
        back.className = 'state-secondary';
        frame.append(front, back);
      } else {
        const inner = el('div', 'flip-inner');
        const front = el('div', 'flip-face front');
        const back = el('div', 'flip-face back');
        front.append(picture(item.front, alt, i < 2));
        back.append(picture(item.back, `${item.title}, reverse side`));
        inner.append(front, back);
        frame.append(inner);
      }
      const toggle = button(item.type === 'switch' ? 'in use' : 'flip', () => {
        pinned = !pinned;
        frame.classList.toggle('is-pinned', pinned);
        toggle.textContent = pinned ? (item.type === 'switch' ? 'artwork' : 'front') : (item.type === 'switch' ? 'in use' : 'flip');
        toggle.setAttribute('aria-pressed', String(pinned));
      }, 'text-action');
      toggle.setAttribute('aria-pressed', 'false');
      const large = button('enlarge', () => {
        const hovered = matchMedia('(hover: hover) and (pointer: fine)').matches && frame.matches(':hover');
        openLarge(pinned || hovered ? item.back : item.front, alt, item.title);
      }, 'text-action');
      actions.append(toggle, large);
    } else if (item.type === 'folder') {
      const foldout = makeFoldout();
      frame.classList.add('viewer-image-frame--folder');
      frame.append(foldout.node);
      actions.append(...foldout.actions.children);
      const outside = '/design/assets/better%20angels%20takeaway%20outside.png';
      registerLightbox(outside, alt, item.title);
      registerLightbox('/design/assets/better%20angels%20takeaway%20inside.png', alt, item.title);
      actions.append(button('enlarge', () => openLarge(outside, alt, item.title), 'text-action'));
    }

    const caption = el('figcaption', 'viewer-caption');
    const copy = el('div', 'viewer-caption-copy');
    copy.append(el('h4', '', item.title));
    if (item.description) copy.append(el('p', '', item.description));
    caption.append(copy, actions);
    figure.append(frame, caption);
    return figure;
  }

  function renderStory(project) {
    const notes = byId('project-notes');
    const container = byId('project-notes-copy');
    notes.open = false;
    container.replaceChildren();
    if (!project.story) { notes.hidden = true; return; }
    const story = el('div', 'project-story');
    const intro = el('section', 'project-story-section');
    intro.append(el('p', '', project.story.intro));
    story.append(intro);
    project.story.sections.forEach(section => {
      const article = el('section', 'project-story-section');
      article.append(el('h3', '', section.heading));
      section.paragraphs.forEach(paragraph => article.append(el('p', '', paragraph)));
      story.append(article);
    });
    const credits = el('section', 'project-story-section project-story-credits');
    credits.append(el('h3', '', 'Credits'), el('p', '', project.story.credit));
    story.append(credits);
    container.append(story);
    notes.hidden = false;
  }

  // Chapter structure drives the groups. A single larger piece or a clear pair
  // is easier to read than three small thumbnails. Poster series remain together.
  function groupSlides(project) {
    const entries = project.chapters.flatMap((chapter, chapterIndex) =>
      chapter.slides.map(item => ({chapter, chapterIndex, item})));
    const mobile = matchMedia('(max-width: 700px)').matches;
    groupSize = mobile ? 1 : 2;
    if (mobile) return entries.map(entry => [entry]);

    // Match the actual series, rather than creating arbitrary grids. These
    // groups keep related artworks together without reducing them to thumbnails.
    const compositions = {
      triennial: [[0,1],[2,3],[4,5],[6,7],[8,9]],
      angels: [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13,14]],
      winter: [[0,1,2]],
      prx: [[0],[1,2]],
      college: [[0,1,2],[3,4,5],[6,7],[8,9]]
    };
    const planned = compositions[project.id];
    if (planned && planned.flat().length === entries.length &&
        planned.flat().every((index, position) => index === position)) {
      return planned.map(group => group.map(index => entries[index]));
    }
    // Safe fallback when new artwork is added to the data later.
    const groups = [];
    for (let i = 0; i < entries.length; i += 2) groups.push(entries.slice(i,i+2));
    return groups;
  }

  // The stage moves by an exact group width. No native horizontal momentum,
  // partial snaps or intermediate stops can leave a group half-visible.
  function positionSlide(animate = true) {
    const track = byId('viewer-track');
    if (!track) return;
    const group = track.children[slideIndex];
    if (!group) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.style.transition = animate && !reduced ? '' : 'none';
    track.style.transform = `translate3d(${-group.offsetLeft}px, 0, 0)`;
  }

  function showCurrentInfo() {
    const group = activeGroups[slideIndex];
    if (!group) return;
    byId('viewer-track')?.querySelectorAll('.viewer-cluster').forEach((node, i) => {
      const current = i === slideIndex;
      node.classList.toggle('is-current', current);
      node.querySelectorAll('button').forEach(control => { control.tabIndex = current ? 0 : -1; });
    });
    const chapter = group[0].chapter;
    byId('viewer-chapter').textContent = activeGroups.length === 1 && projectIndex >= 0 && projects[projectIndex].id === 'prx'
      ? 'Identity and promotion' : chapter.title;
    byId('viewer-summary').textContent = activeGroups.length === 1 && projectIndex >= 0 && projects[projectIndex].id === 'prx'
      ? 'Cover art, newsletter design, and social graphics.' : chapter.summary || '';
    byId('viewer-count').textContent = `${slideIndex + 1} / ${activeGroups.length}`;
    byId('viewer-prev').disabled = slideIndex === 0;
    byId('viewer-next').disabled = slideIndex === activeGroups.length - 1;
  }

  function moveSlide(index, animate = true) {
    slideIndex = Math.max(0, Math.min(activeGroups.length - 1, index));
    showCurrentInfo();
    positionSlide(animate);
  }

  function renderProject() {
    const project = projects[projectIndex];
    study.dataset.project = project.id;
    byId('study-title').textContent = project.title;
    byId('study-tagline').textContent = project.tagline;
    renderStory(project);
    lightboxItems = [];
    activeGroups = groupSlides(project);
    slideIndex = 0;
    gallery.replaceChildren();

    const viewer = el('div', 'viewer');
    const context = el('div', 'viewer-context');
    const chapter = el('h3', '', ''); chapter.id = 'viewer-chapter';
    const summary = el('p', '', ''); summary.id = 'viewer-summary';
    const controls = el('div', 'viewer-controls');
    const count = el('span', 'viewer-count', ''); count.id = 'viewer-count';
    count.setAttribute('aria-live', 'polite');
    const previous = button('previous', () => moveSlide(slideIndex - 1), 'text-action'); previous.id = 'viewer-prev';
    const next = button('next', () => moveSlide(slideIndex + 1), 'text-action'); next.id = 'viewer-next';
    controls.append(previous, next, count);
    controls.hidden = activeGroups.length <= 1;
    context.append(chapter, summary, controls);

    const visual = el('div', 'viewer-visual');
    const track = el('div', 'viewer-track');
    track.id = 'viewer-track';
    track.classList.toggle('is-single', activeGroups.length <= 1);
    track.tabIndex = activeGroups.length > 1 ? 0 : -1;
    track.setAttribute('role', 'region');
    track.setAttribute('aria-roledescription', 'carousel');
    track.setAttribute('aria-label', `${project.name} artwork. Swipe sideways or use previous and next.`);

    let artworkIndex = 0;
    activeGroups.forEach((entries, groupIndex) => {
      const cluster = el('div', 'viewer-cluster');
      cluster.dataset.index = String(groupIndex);
      cluster.dataset.size = String(entries.length);
      cluster.setAttribute('role', 'group');
      cluster.setAttribute('aria-roledescription', 'slide');
      cluster.setAttribute('aria-label', `Artwork group ${groupIndex + 1} of ${activeGroups.length}`);
      entries.forEach(entry => {
        cluster.append(renderArtwork(entry, artworkIndex++));
      });
      track.append(cluster);
    });

    visual.append(track);
    viewer.append(context, visual);
    gallery.append(viewer);
    showCurrentInfo();

    // One swipe advances one complete group. Vertical touch scrolling remains native.
    let gesture = null;
    visual.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      gesture = {x: event.clientX, y: event.clientY};
    });
    visual.addEventListener('pointerup', event => {
      if (!gesture) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        moveSlide(slideIndex + (dx < 0 ? 1 : -1));
      }
    });
    visual.addEventListener('pointercancel', () => { gesture = null; });
    let lastWheelMove = 0;
    visual.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.15) return;
      event.preventDefault();
      if (activeGroups.length <= 1) return;
      const now = performance.now();
      if (now - lastWheelMove < 480) return;
      lastWheelMove = now;
      moveSlide(slideIndex + (event.deltaX > 0 ? 1 : -1));
    }, {passive: false});
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); moveSlide(slideIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveSlide(slideIndex - 1); }
    });
    requestAnimationFrame(() => positionSlide(false));
    byId('study-next-project').onclick = () => openProject((projectIndex + 1) % projects.length);
  }

  window.addEventListener('resize', () => {
    if (projectIndex < 0) return;
    if (resizeTick) cancelAnimationFrame(resizeTick);
    resizeTick = requestAnimationFrame(() => {
      const needed = matchMedia('(max-width: 700px)').matches ? 1 : 2;
      if (needed !== groupSize) {
        const visiblePiece = activeGroups[slideIndex]?.[0]?.item;
        renderProject();
        const recovered = activeGroups.findIndex(group => group.some(entry => entry.item === visiblePiece));
        moveSlide(Math.max(0, recovered), false);
      } else positionSlide(false);
    });
  }, {passive: true});

  function updateUrl() {
    history.pushState(null, '', projectIndex < 0 ? '/design/' : `/design/#${projects[projectIndex].id}`);
  }
  function openProject(i, fromUrl = false) {
    projectIndex = i;
    overview.hidden = true;
    study.hidden = false;
    renderProject();
    if (!fromUrl) updateUrl();
    window.scrollTo({top: 0, behavior: 'instant'});
  }
  function closeProject(fromUrl = false) {
    projectIndex = -1;
    study.hidden = true;
    overview.hidden = false;
    if (!fromUrl) updateUrl();
    window.scrollTo({top: 0, behavior: 'instant'});
  }
  byId('all-work').addEventListener('click', () => closeProject());
  document.addEventListener('keydown', event => {
    if (dialog.open) {
      if (event.key === 'ArrowRight') { event.preventDefault(); moveLightbox(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
    } else if (event.key === 'Escape' && !study.hidden) closeProject();
  });
  function readHash() {
    const slug = location.hash.slice(1).split('/')[0];
    const i = projects.findIndex(project => project.id === slug);
    if (i >= 0) openProject(i, true);
    else if (projectIndex >= 0) closeProject(true);
  }
  window.addEventListener('popstate', readHash);
  window.addEventListener('hashchange', readHash);
  showPreview(0);
  readHash();

  const wip = byId('wip-dialog');
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('keegan-biz-design-wip-dismissed') === '1'; } catch (_) {}
  if (wip && !dismissed && wip.showModal) {
    wip.querySelector('[data-wip-dismiss]')?.addEventListener('click', () => wip.close());
    wip.addEventListener('click', event => { if (event.target === wip) wip.close(); });
    wip.addEventListener('close', () => {
      try { sessionStorage.setItem('keegan-biz-design-wip-dismissed', '1'); } catch (_) {}
    });
    wip.showModal();
  }
})();
