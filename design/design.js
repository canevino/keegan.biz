(() => {
  'use strict';
  const projects = window.DESIGN_PORTFOLIO || [];
  if (!projects.length) return;

  const byId = (id) => document.getElementById(id);
  const overview = byId('overview');
  const study = byId('study');
  const index = byId('work-index');
  const gallery = byId('project-gallery');
  const artDialog = byId('art-dialog');
  const artDialogImage = byId('art-dialog-image');
  const featureImage = byId('feature-image');
  const featureDescription = byId('feature-description');
  let previewIndex = 0;
  let projectIndex = -1;

  function el(tag, className, text) {
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
  function picture(src, alt) {
    const node = el('img');
    node.src = src;
    node.alt = alt || '';
    node.decoding = 'async';
    node.loading = 'lazy';
    return node;
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
    const node = button('', () => openProject(i), 'work-item');
    node.append(el('span', '', project.name), el('span', 'work-mark', '+'));
    node.querySelector('.work-mark').setAttribute('aria-hidden', 'true');
    node.addEventListener('mouseenter', () => {
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) showPreview(i);
    });
    node.addEventListener('focus', () => showPreview(i));
    index.append(node);
  });
  byId('feature-open').addEventListener('click', () => openProject(previewIndex));
  byId('feature-action').addEventListener('click', () => openProject(previewIndex));

  function openLarge(src, alt) {
    if (!src || !artDialog?.showModal) return;
    artDialogImage.src = src;
    artDialogImage.alt = alt || 'Artwork';
    artDialog.showModal();
  }
  byId('art-dialog-close').addEventListener('click', () => artDialog.close());
  artDialog.addEventListener('click', (event) => {
    if (event.target === artDialog) artDialog.close();
  });
  artDialog.addEventListener('close', () => artDialogImage.removeAttribute('src'));

  function makeFoldout() {
    const outside = '/design/assets/better%20angels%20takeaway%20outside.png';
    const inside = '/design/assets/better%20angels%20takeaway%20inside.png';
    let folded = false;
    let flipped = false;
    const view = el('div', 'folder-view');
    const stage = el('button', 'folder-stage');
    stage.type = 'button';
    const flat = picture(outside, 'Better Angels foldout, laid flat');
    flat.className = 'folder-flat';
    const model = el('div', 'paper-folder');
    model.setAttribute('aria-hidden', 'true');
    for (const part of ['center', 'tongue', 'left', 'right']) {
      const pane = el('div', `folder-panel folder-panel--${part}`);
      pane.append(
        el('div', 'folder-panel__face folder-panel__face--front folder-art--outside'),
        el('div', 'folder-panel__face folder-panel__face--back folder-art--inside')
      );
      model.append(pane);
    }
    stage.append(flat, model);
    const actions = el('div', 'item-actions');
    const fold = button('fold', () => { folded = !folded; sync(); });
    const flip = button('flip', () => { flipped = !flipped; sync(); });
    actions.append(fold, flip);
    function sync() {
      view.classList.toggle('is-folded', folded);
      view.classList.toggle('is-flipped', flipped);
      flat.src = flipped ? inside : outside;
      flat.alt = `Better Angels foldout, ${flipped ? 'inside' : 'outside'}`;
      fold.textContent = folded ? 'unfold' : 'fold';
      flip.textContent = flipped ? 'outside' : 'inside';
      fold.setAttribute('aria-pressed', String(folded));
      flip.setAttribute('aria-pressed', String(flipped));
      stage.setAttribute('aria-pressed', String(folded));
      stage.setAttribute('aria-label', `${folded ? 'Unfold' : 'Fold'} the Better Angels paper takeaway`);
    }
    stage.addEventListener('click', () => { folded = !folded; sync(); });
    sync();
    view.append(stage);
    return { node: view, actions };
  }

  function renderArtwork(item) {
    const figure = el('figure', `gallery-item gallery-item--${item.type}`);
    const media = el('div', 'gallery-item-media');
    const caption = el('figcaption', 'gallery-item-caption');
    caption.append(el('strong', '', item.title));
    if (item.description) caption.append(el('span', 'art-description', item.description));
    const actions = el('div', 'item-actions');

    if (item.type === 'image') {
      const zoom = button('', () => openLarge(item.src, item.alt), 'art-image');
      zoom.setAttribute('aria-label', `Enlarge ${item.title}`);
      zoom.append(picture(item.src, item.alt));
      media.append(zoom);
    } else if (item.type === 'switch') {
      let showingUse = false;
      const zoom = el('button', 'art-image');
      zoom.type = 'button';
      const img = picture(item.front, item.alt);
      zoom.append(img);
      function setInUse(value) {
        showingUse = value;
        img.src = showingUse ? item.back : item.front;
        img.alt = showingUse ? `${item.title} photographed in use` : item.alt;
        toggle.textContent = showingUse ? 'artwork' : 'in use';
        toggle.setAttribute('aria-pressed', String(showingUse));
      }
      const toggle = button('in use', () => setInUse(!showingUse));
      toggle.setAttribute('aria-pressed', 'false');
      // Desktop visitors can compare the installed piece simply by hovering.
      // On touch screens, the same view is available by tapping the artwork or button.
      media.addEventListener('mouseenter', () => {
        if (matchMedia('(hover: hover) and (pointer: fine)').matches) setInUse(true);
      });
      media.addEventListener('mouseleave', () => {
        if (matchMedia('(hover: hover) and (pointer: fine)').matches) setInUse(false);
      });
      zoom.setAttribute('aria-label', `Switch the artwork and in-use photographs for ${item.title}`);
      zoom.addEventListener('click', () => toggle.click());
      actions.append(toggle, button('enlarge', () => openLarge(showingUse ? item.back : item.front, img.alt)));
      media.append(zoom);
    } else if (item.type === 'flip') {
      let flipped = false;
      const zoom = el('button', 'art-image flip-image');
      zoom.type = 'button';
      const inner = el('div', 'flip-inner');
      const front = el('div', 'flip-face front');
      const back = el('div', 'flip-face back');
      front.append(picture(item.front, item.alt));
      back.append(picture(item.back, `${item.title}, reverse side`));
      inner.append(front, back);
      zoom.append(inner);
      const toggle = button('flip', () => {
        flipped = !flipped;
        inner.classList.toggle('is-flipped', flipped);
        toggle.textContent = flipped ? 'front' : 'flip';
        toggle.setAttribute('aria-pressed', String(flipped));
      });
      toggle.setAttribute('aria-pressed', 'false');
      zoom.setAttribute('aria-label', `Flip ${item.title}`);
      zoom.addEventListener('click', () => toggle.click());
      actions.append(toggle, button('enlarge', () => openLarge(flipped ? item.back : item.front, item.alt)));
      media.append(zoom);
    } else if (item.type === 'folder') {
      const foldout = makeFoldout();
      media.append(foldout.node);
      actions.append(...foldout.actions.children);
    }
    if (actions.childElementCount) media.append(actions);
    figure.append(media, caption);
    return figure;
  }

  function renderStory(project) {
    const notes = byId('project-notes');
    const container = byId('project-notes-copy');
    notes.open = false;
    container.replaceChildren();
    if (project.story) {
      const story = el('div', 'project-story');
      const intro = el('section', 'project-story-section');
      intro.append(el('p', '', project.story.intro));
      story.append(intro);
      project.story.sections.forEach((section) => {
        const article = el('section', 'project-story-section');
        article.append(el('h3', '', section.heading));
        section.paragraphs.forEach((para) => article.append(el('p', '', para)));
        story.append(article);
      });
      const credits = el('section', 'project-story-section project-story-credits');
      credits.append(el('h3', '', 'Credits'), el('p', '', project.story.credit));
      story.append(credits);
      container.append(story);
      notes.hidden = false;
    } else {
      notes.hidden = true;
    }
  }

  function renderProject() {
    const project = projects[projectIndex];
    study.dataset.project = project.id;
    byId('study-title').textContent = project.title;
    byId('study-tagline').textContent = project.tagline;
    gallery.replaceChildren();
    renderStory(project);
    project.chapters.forEach((chapter, chapterIndex) => {
      const section = el('section', 'gallery-section');
      section.dataset.chapter = String(chapterIndex);
      const copy = el('div', 'gallery-section-copy');
      copy.append(el('h3', '', chapter.title));
      if (chapter.summary && chapter.summary !== project.tagline) copy.append(el('p', '', chapter.summary));
      const items = el('div', 'gallery-items');
      chapter.slides.forEach((item) => items.append(renderArtwork(item)));
      section.append(copy, items);
      gallery.append(section);
    });
  }

  function updateUrl() {
    history.pushState(null, '', projectIndex === -1 ? '/design/' : `/design/#${projects[projectIndex].id}`);
  }
  function openProject(index, fromUrl = false) {
    projectIndex = index;
    overview.hidden = true;
    study.hidden = false;
    renderProject();
    if (!fromUrl) updateUrl();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function closeProject(fromUrl = false) {
    projectIndex = -1;
    study.hidden = true;
    overview.hidden = false;
    if (!fromUrl) updateUrl();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  byId('all-work').addEventListener('click', () => closeProject());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !study.hidden && !artDialog.open) closeProject();
  });
  function readHash() {
    const slug = location.hash.slice(1).split('/')[0];
    const index = projects.findIndex((project) => project.id === slug);
    if (index >= 0) openProject(index, true);
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
    wip.addEventListener('click', (event) => { if (event.target === wip) wip.close(); });
    wip.addEventListener('close', () => {
      try { sessionStorage.setItem('keegan-biz-design-wip-dismissed', '1'); } catch (_) {}
    });
    wip.showModal();
  }
})();
