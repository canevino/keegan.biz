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
  let activeSlides = [];
  let lightboxIndex = -1;
  let lightboxItems = [];
  let scrollTick = null;

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
      if (dialogImage.src !== new URL(item.src, location.href).href) return;
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

  function renderSlide(slide, i) {
    const item = slide.item;
    const figure = el('figure', 'viewer-slide');
    figure.dataset.index = String(i);
    figure.setAttribute('aria-label', `${i + 1} of ${activeSlides.length}, ${item.title}`);
    const media = el('div', 'viewer-media');
    const actionArea = el('div', 'slide-actions');
    const frame = el('div', 'viewer-image-frame');
    const alt = item.alt || item.title;

    if (item.type === 'image') {
      const image = picture(item.src, alt, i === 0);
      frame.append(image);
      registerLightbox(item.src, alt, item.title);
      actionArea.append(button('enlarge', () => openLarge(item.src, alt, item.title), 'text-action'));
    } else if (item.type === 'switch' || item.type === 'flip') {
      let pinned = false;
      frame.classList.add('has-reverse', `has-reverse--${item.type}`);
      registerLightbox(item.front, alt, item.title);
      registerLightbox(item.back, `${item.title}, reverse or in use`, item.title);
      if (item.type === 'switch') {
        const front = picture(item.front, alt, i === 0);
        const back = picture(item.back, `${item.title} in use`);
        front.className = 'state-primary';
        back.className = 'state-secondary';
        frame.append(front, back);
      } else {
        const inner = el('div', 'flip-inner');
        const front = el('div', 'flip-face front');
        const back = el('div', 'flip-face back');
        front.append(picture(item.front, alt));
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
        const reverse = pinned || (hovered && !pinned);
        openLarge(reverse ? item.back : item.front, alt, item.title);
      }, 'text-action');
      actionArea.append(toggle, large);
    } else if (item.type === 'folder') {
      const foldout = makeFoldout();
      frame.append(foldout.node);
      actionArea.append(...foldout.actions.children);
      registerLightbox('/design/assets/better%20angels%20takeaway%20outside.png', alt, item.title);
      registerLightbox('/design/assets/better%20angels%20takeaway%20inside.png', alt, item.title);
      actionArea.append(button('enlarge', () => openLarge('/design/assets/better%20angels%20takeaway%20outside.png', alt, item.title), 'text-action'));
    }
    media.append(frame, actionArea);
    figure.append(media);
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

  function updateSlideFrames() {
    const track = byId('viewer-track');
    if (!track) return;
    const maxHeight = matchMedia('(max-width: 700px)').matches ? Math.min(430, window.innerWidth * 1.10) :
      matchMedia('(max-width: 980px)').matches ? 450 : 470;
    [...track.children].forEach(slide => {
      const frame = slide.querySelector('.viewer-image-frame');
      const image = frame?.querySelector('img');
      if (!image?.naturalWidth || !image.naturalHeight) return;
      const displayWidth = Math.min(track.clientWidth, image.naturalWidth);
      const fitted = image.naturalHeight * Math.min(displayWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const desired = Math.max(165, Math.min(maxHeight, Math.round(fitted + 20)));
      frame.style.height = `${desired}px`;
    });
    const current = track.children[slideIndex];
    const media = current?.querySelector('.viewer-media');
    if (media) track.style.height = `${Math.ceil(media.getBoundingClientRect().height)}px`;
  }
  function showCurrentInfo() {
    const entry = activeSlides[slideIndex];
    if (!entry) return;
    const chapter = entry.chapter;
    byId('viewer-chapter').textContent = chapter.title;
    byId('viewer-summary').textContent = chapter.summary || '';
    byId('viewer-art-title').textContent = entry.item.title;
    byId('viewer-art-title').hidden = entry.item.title.trim().toLowerCase() === chapter.title.trim().toLowerCase();
    byId('viewer-description').textContent = entry.item.description || '';
    byId('viewer-description').hidden = !entry.item.description;
    byId('viewer-count').textContent = `${slideIndex + 1} of ${activeSlides.length}`;
    byId('viewer-prev').disabled = slideIndex === 0;
    byId('viewer-next').disabled = slideIndex === activeSlides.length - 1;
    requestAnimationFrame(updateSlideFrames);
  }
  function moveSlide(index, smooth = true) {
    const next = Math.max(0, Math.min(activeSlides.length - 1, index));
    slideIndex = next;
    showCurrentInfo();
    const track = byId('viewer-track');
    const width = track.clientWidth;
    track.scrollTo({left: next * width, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'});
  }
  function flattenSlides(project) {
    return project.chapters.flatMap((chapter, chapterIndex) =>
      chapter.slides.map(item => ({chapter, chapterIndex, item})));
  }
  function renderProject() {
    const project = projects[projectIndex];
    study.dataset.project = project.id;
    byId('study-title').textContent = project.title;
    byId('study-tagline').textContent = project.tagline;
    renderStory(project);
    lightboxItems = [];
    activeSlides = flattenSlides(project);
    slideIndex = 0;
    gallery.replaceChildren();

    const viewer = el('div', 'viewer');
    const context = el('div', 'viewer-context');
    const chapter = el('h3', '', ''); chapter.id = 'viewer-chapter';
    const summary = el('p', '', ''); summary.id = 'viewer-summary';
    context.append(chapter, summary);

    const visual = el('div', 'viewer-visual');
    const track = el('div', 'viewer-track');
    track.id = 'viewer-track';
    track.tabIndex = 0;
    track.setAttribute('role', 'region');
    track.setAttribute('aria-label', `${project.name} artwork. Scroll horizontally or use previous and next.`);
    activeSlides.forEach((item, i) => {
      const slide = renderSlide(item, i);
      track.append(slide);
      const image = slide.querySelector('.viewer-image-frame img');
      if (image && !image.complete) image.addEventListener('load', updateSlideFrames, {once: true});
    });

    const detailRow = el('div', 'viewer-detail');
    const assetText = el('div', 'viewer-asset-text');
    const title = el('h4', '', ''); title.id = 'viewer-art-title';
    const description = el('p', '', ''); description.id = 'viewer-description';
    assetText.append(title, description);

    const controls = el('div', 'viewer-controls');
    const count = el('span', 'viewer-count', ''); count.id = 'viewer-count';
    count.setAttribute('aria-live', 'polite');
    const previous = button('previous', () => moveSlide(slideIndex - 1), 'text-action'); previous.id = 'viewer-prev';
    const next = button('next', () => moveSlide(slideIndex + 1), 'text-action'); next.id = 'viewer-next';
    controls.append(count, previous, next);
    detailRow.append(assetText, controls);
    visual.append(track, detailRow);
    viewer.append(context, visual);
    gallery.append(viewer);
    showCurrentInfo();

    // A single scrollable track holds the entire project. Swipe/trackpad, buttons,
    // and keyboard all operate on the same index, with no nested galleries.
    window.addEventListener('resize', updateSlideFrames, {passive: true});
    track.addEventListener('scroll', () => {
      if (scrollTick) cancelAnimationFrame(scrollTick);
      scrollTick = requestAnimationFrame(() => {
        const nextIndex = Math.min(activeSlides.length - 1, Math.max(0, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))));
        if (nextIndex !== slideIndex) { slideIndex = nextIndex; showCurrentInfo(); }
      });
    }, {passive: true});
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); moveSlide(slideIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveSlide(slideIndex - 1); }
    });
    requestAnimationFrame(updateSlideFrames);
    byId('study-next-project').onclick = () => openProject((projectIndex + 1) % projects.length);
  }

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
