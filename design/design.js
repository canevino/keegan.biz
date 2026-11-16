(() => {
  'use strict';

  const projects = window.DESIGN_PORTFOLIO || [];
  if (!projects.length) return;

  const $ = (id) => document.getElementById(id);
  const overview = $('overview');
  const study = $('study');
  const index = $('work-index');
  const featureImage = $('feature-image');
  const featureDescription = $('feature-description');
  const chapterNavigation = $('chapter-navigation');
  const thumbnails = $('media-thumbnails');
  const stage = $('media-stage');
  const artDialog = $('art-dialog');
  const artDialogImage = $('art-dialog-image');

  let previewIndex = 0;
  let projectIndex = -1;
  let chapterIndex = 0;
  let slideIndex = 0;
  let alternativeView = false;
  let folded = false;
  let flipped = false;

  const getProject = () => projects[projectIndex];
  const getChapter = () => getProject().chapters[chapterIndex];
  const getSlide = () => getChapter().slides[slideIndex];
  const create = (tag, cls, text) => {
    const element = document.createElement(tag);
    if (cls) element.className = cls;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const assetThumbnail = (slide) => slide.src || slide.front || '/design/assets/better%20angels%20takeaway%20outside.png';

  function showPreview(next) {
    previewIndex = next;
    const project = projects[next];
    featureImage.src = project.cover;
    featureImage.alt = project.tagline;
    featureDescription.textContent = project.tagline;
    $('feature-open').setAttribute('aria-label', `Open ${project.title}`);
    index.querySelectorAll('.work-item').forEach((button, idx) => {
      button.classList.toggle('is-active', idx === next);
      if (idx === next) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }

  // Preload the small set of overview covers so hover previews do not flash blank.
  projects.forEach((project) => { const img = new Image(); img.src = project.cover; });

  projects.forEach((project, idx) => {
    const button = create('button', 'work-item');
    button.type = 'button';
    const label = create('span', '', project.name);
    const arrow = create('span', 'work-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    button.append(label, arrow);
    button.addEventListener('mouseenter', () => { if (window.innerWidth > 720) showPreview(idx); });
    button.addEventListener('focus', () => showPreview(idx));
    button.addEventListener('click', () => openProject(idx));
    index.append(button);
  });
  $('feature-open').addEventListener('click', () => openProject(previewIndex));
  $('feature-action').addEventListener('click', () => openProject(previewIndex));

  function updateAddress(replace = true) {
    const url = projectIndex < 0 ? '/design/' : `/design/#${getProject().id}/${chapterIndex}/${slideIndex}`;
    const fn = replace ? 'replaceState' : 'pushState';
    history[fn](null, '', url);
  }

  function renderChapterNav() {
    chapterNavigation.replaceChildren();
    getProject().chapters.forEach((chapter, idx) => {
      const button = create('button', idx === chapterIndex ? 'is-active' : '', chapter.title);
      button.type = 'button';
      if (idx === chapterIndex) button.setAttribute('aria-current', 'true');
      button.addEventListener('click', () => goTo(idx, 0, false));
      chapterNavigation.append(button);
    });
  }

  function renderText() {
    const chapter = getChapter();
    $('chapter-summary').textContent = chapter.summary || getProject().tagline;
    const original = [chapter.notes, chapter.credits].filter(Boolean).join('');
    $('project-notes').hidden = !original;
    $('project-notes').open = false;
    $('project-notes-copy').innerHTML = original;
  }

  function openLarge(src, alt) {
    if (!artDialog || typeof artDialog.showModal !== 'function') return;
    artDialogImage.src = src;
    artDialogImage.alt = alt || 'Artwork enlarged';
    artDialog.showModal();
  }
  $('art-dialog-close').addEventListener('click', () => artDialog.close());
  artDialog.addEventListener('click', (event) => {
    if (event.target === artDialog) artDialog.close();
  });
  artDialog.addEventListener('close', () => {
    artDialogImage.removeAttribute('src');
  });

  function addMediaAction(label, action) {
    const button = create('button', '', label);
    button.type = 'button';
    button.addEventListener('click', action);
    $('media-actions').append(button);
    return button;
  }

  function mediaImage(src, alt) {
    const img = create('img');
    img.src = src;
    img.alt = alt;
    img.decoding = 'async';
    img.loading = 'eager';
    return img;
  }

  function renderFolder() {
    const wrapper = create('div', 'folder-view');
    wrapper.classList.toggle('is-folded', folded);
    wrapper.classList.toggle('is-flipped', flipped);
    const folderStage = create('div', 'folder-stage');
    folderStage.role = 'button';
    folderStage.tabIndex = 0;
    folderStage.setAttribute('aria-label', `Better Angels foldout, ${folded ? 'folded' : 'unfolded'}. Activate to ${folded ? 'unfold' : 'fold'}`);
    folderStage.setAttribute('aria-pressed', String(folded));
    const model = create('div', 'paper-folder');
    for (const part of ['center', 'tongue', 'left', 'right']) {
      const panel = create('div', `folder-panel folder-panel--${part}`);
      panel.append(create('div', 'folder-panel__face folder-panel__face--front folder-art--outside'), create('div', 'folder-panel__face folder-panel__face--back folder-art--inside'));
      model.append(panel);
    }
    folderStage.append(model);
    wrapper.append(folderStage);
    stage.append(wrapper);
    function sync() {
      wrapper.classList.toggle('is-folded', folded);
      wrapper.classList.toggle('is-flipped', flipped);
      folderStage.setAttribute('aria-pressed', String(folded));
      folderStage.setAttribute('aria-label', `Better Angels foldout, ${folded ? 'folded' : 'unfolded'}. Activate to ${folded ? 'unfold' : 'fold'}`);
      flipButton.textContent = flipped ? 'outside' : 'flip';
      foldButton.textContent = folded ? 'unfold' : 'fold';
    }
    const flipButton = addMediaAction('flip', () => { flipped = !flipped; sync(); });
    const foldButton = addMediaAction('fold', () => { folded = !folded; sync(); });
    const foldAction = () => { folded = !folded; sync(); };
    folderStage.addEventListener('click', foldAction);
    folderStage.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); foldAction(); }
    });
  }

  function renderArt() {
    const item = getSlide();
    stage.replaceChildren();
    $('media-actions').replaceChildren();
    $('media-title').textContent = item.title || getChapter().title;
    $('media-caption').textContent = item.description || '';
    alternativeView = false;
    folded = false;
    flipped = false;

    if (item.type === 'folder') {
      renderFolder();
    } else if (item.type === 'image') {
      const imageButton = create('button', 'media-target');
      imageButton.type = 'button';
      imageButton.setAttribute('aria-label', `View larger: ${item.alt}`);
      imageButton.append(mediaImage(item.src, item.alt));
      imageButton.addEventListener('click', () => openLarge(item.src, item.alt));
      stage.append(imageButton);
      addMediaAction('view larger', () => openLarge(item.src, item.alt));
    } else if (item.type === 'switch') {
      const button = create('button', 'interactive-media');
      button.type = 'button';
      const img = mediaImage(item.front, item.alt);
      button.append(img);
      stage.append(button);
      const action = () => {
        alternativeView = !alternativeView;
        img.src = alternativeView ? item.back : item.front;
        img.alt = alternativeView ? `${item.title}, installed view` : item.alt;
        switchButton.textContent = alternativeView ? 'artwork' : 'in use';
        switchButton.setAttribute('aria-pressed', String(alternativeView));
      };
      const switchButton = addMediaAction('in use', action);
      switchButton.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', action);
      button.setAttribute('aria-label', `Switch artwork and installed photograph for ${item.title}`);
      addMediaAction('view larger', () => openLarge(img.src, img.alt));
    } else if (item.type === 'flip') {
      const button = create('button', 'interactive-media');
      button.type = 'button';
      button.setAttribute('aria-label', `Flip ${item.title}`);
      const inner = create('div', 'flip-inner');
      const front = create('div', 'flip-face front');
      const back = create('div', 'flip-face back');
      front.append(mediaImage(item.front, item.alt));
      back.append(mediaImage(item.back, `${item.title}, reverse side`));
      inner.append(front, back);
      button.append(inner);
      stage.append(button);
      const action = () => {
        flipped = !flipped;
        inner.classList.toggle('is-flipped', flipped);
        flipButton.textContent = flipped ? 'front' : 'flip';
        flipButton.setAttribute('aria-pressed', String(flipped));
      };
      const flipButton = addMediaAction('flip', action);
      flipButton.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', action);
      addMediaAction('view larger', () => openLarge(flipped ? item.back : item.front, item.alt));
    }
  }

  function renderThumbnails() {
    thumbnails.replaceChildren();
    const chapter = getChapter();
    if (chapter.slides.length <= 1) { thumbnails.hidden = true; return; }
    thumbnails.hidden = false;
    chapter.slides.forEach((slide, idx) => {
      const button = create('button', idx === slideIndex ? 'is-active' : '');
      button.type = 'button';
      button.setAttribute('aria-label', `View ${slide.title}`);
      if (idx === slideIndex) button.setAttribute('aria-current', 'true');
      const img = mediaImage(assetThumbnail(slide), slide.alt || slide.title);
      img.loading = 'lazy';
      button.append(img);
      button.addEventListener('click', () => goTo(chapterIndex, idx, true));
      thumbnails.append(button);
    });
    // Keep the active thumbnail visible without scrolling the main document.
    thumbnails.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }

  function goTo(nextChapter, nextSlide, replace = true) {
    chapterIndex = nextChapter;
    slideIndex = nextSlide;
    renderChapterNav();
    renderText();
    renderArt();
    renderThumbnails();
    updateAddress(replace);
  }

  function openProject(idx, chapter = 0, slide = 0, fromUrl = false) {
    projectIndex = idx;
    overview.hidden = true;
    study.hidden = false;
    const project = getProject();
    $('study-title').textContent = project.title;
    $('study-tagline').textContent = project.tagline;
    $('next-project').textContent = 'next project →';
    if (!fromUrl) updateAddress(false);
    goTo(Math.max(0, Math.min(chapter, project.chapters.length - 1)), Math.max(0, Math.min(slide, (project.chapters[chapter]?.slides.length || 1) - 1)), true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function closeProject(fromUrl = false) {
    projectIndex = -1;
    study.hidden = true;
    overview.hidden = false;
    if (!fromUrl) updateAddress(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function step(direction) {
    let nextSlide = slideIndex + direction;
    let nextChapter = chapterIndex;
    if (nextSlide >= getChapter().slides.length) { nextChapter = (chapterIndex + 1) % getProject().chapters.length; nextSlide = 0; }
    if (nextSlide < 0) { nextChapter = (chapterIndex - 1 + getProject().chapters.length) % getProject().chapters.length; nextSlide = getProject().chapters[nextChapter].slides.length - 1; }
    goTo(nextChapter, nextSlide, true);
  }

  $('previous-art').addEventListener('click', () => step(-1));
  $('next-art').addEventListener('click', () => step(1));
  $('all-work').addEventListener('click', () => closeProject());
  $('next-project').addEventListener('click', () => openProject((projectIndex + 1) % projects.length));
  document.addEventListener('keydown', (event) => {
    if (study.hidden || artDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    const tag = event.target.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'Escape') closeProject();
  });

  function readHash() {
    const raw = window.location.hash.slice(1);
    if (!raw) { if (projectIndex >= 0) closeProject(true); return; }
    const [slug, chapterRaw, slideRaw] = raw.split('/');
    const idx = projects.findIndex((p) => p.id === slug);
    if (idx < 0) return;
    const c = Number.isInteger(Number(chapterRaw)) ? Number(chapterRaw) : 0;
    const s = Number.isInteger(Number(slideRaw)) ? Number(slideRaw) : 0;
    openProject(idx, c, s, true);
  }
  window.addEventListener('popstate', readHash);
  showPreview(0);
  readHash();

  // The site's brief work-in-progress notice is kept once per session.
  const wip = $('wip-dialog');
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('keegan-biz-design-wip-dismissed') === '1'; } catch (_) { /* Private browsing */ }
  if (wip && !dismissed && typeof wip.showModal === 'function') {
    wip.querySelector('[data-wip-dismiss]')?.addEventListener('click', () => wip.close());
    wip.addEventListener('click', (event) => { if (event.target === wip) wip.close(); });
    wip.addEventListener('close', () => {
      try { sessionStorage.setItem('keegan-biz-design-wip-dismissed', '1'); } catch (_) { /* Private browsing */ }
    });
    wip.showModal();
  }
})();
