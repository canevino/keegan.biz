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
  const gallery = $('project-gallery');
  const artDialog = $('art-dialog');
  const artDialogImage = $('art-dialog-image');

  let previewIndex = 0;
  let projectIndex = -1;
  const create = (tag, className = '', value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = value;
    return el;
  };

  function previewSrc(project, chapter, slide, side, original) {
    if (!original || /\.gif(?:\?|$)/i.test(original)) return original;
    return `/design/assets/gallery/${project.id}-${chapter}-${slide}-${side}.webp`;
  }

  function showPreview(next) {
    previewIndex = next;
    const project = projects[next];
    featureImage.src = `/design/assets/gallery/cover-${project.id}.webp`;
    featureImage.alt = project.tagline;
    featureDescription.textContent = project.tagline;
    $('feature-open').setAttribute('aria-label', `Open ${project.name}`);
    index.querySelectorAll('.work-item').forEach((button, idx) => {
      button.classList.toggle('is-active', idx === next);
      if (idx === next) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }

  projects.forEach((project, idx) => {
    const button = create('button', 'work-item');
    button.type = 'button';
    button.append(create('span', '', project.name), create('span', 'work-mark', '+'));
    button.querySelector('.work-mark').setAttribute('aria-hidden', 'true');
    button.addEventListener('mouseenter', () => { if (window.innerWidth > 720) showPreview(idx); });
    button.addEventListener('focus', () => showPreview(idx));
    button.addEventListener('click', () => openProject(idx));
    index.append(button);
  });
  projects.forEach((project) => { const img = new Image(); img.src = `/design/assets/gallery/cover-${project.id}.webp`; });
  $('feature-open').addEventListener('click', () => openProject(previewIndex));
  $('feature-action').addEventListener('click', () => openProject(previewIndex));

  function image(src, alt) {
    const img = create('img');
    img.src = src;
    img.alt = alt || '';
    img.decoding = 'async';
    img.loading = 'eager';
    return img;
  }

  function openLarge(src, alt) {
    if (!src || !artDialog?.showModal) return;
    artDialogImage.src = src;
    artDialogImage.alt = alt || 'Enlarged artwork';
    artDialog.showModal();
  }
  $('art-dialog-close').addEventListener('click', () => artDialog.close());
  artDialog.addEventListener('click', (event) => { if (event.target === artDialog) artDialog.close(); });
  artDialog.addEventListener('close', () => artDialogImage.removeAttribute('src'));

  function control(label, action) {
    const button = create('button', '', label);
    button.type = 'button';
    button.addEventListener('click', action);
    return button;
  }

  function folderMedia() {
    let folded = false;
    let flipped = false;
    const view = create('div', 'folder-view');
    const stage = create('button', 'folder-stage');
    stage.type = 'button';
    const model = create('div', 'paper-folder');
    for (const part of ['center', 'tongue', 'left', 'right']) {
      const panel = create('div', `folder-panel folder-panel--${part}`);
      panel.append(create('div', 'folder-panel__face folder-panel__face--front folder-art--outside'), create('div', 'folder-panel__face folder-panel__face--back folder-art--inside'));
      model.append(panel);
    }
    stage.append(model);
    const actions = create('div', 'item-actions');
    const flip = control('flip', () => { flipped = !flipped; sync(); });
    const fold = control('fold', () => { folded = !folded; sync(); });
    actions.append(fold, flip);
    function sync() {
      view.classList.toggle('is-folded', folded);
      view.classList.toggle('is-flipped', flipped);
      stage.setAttribute('aria-label', `${folded ? 'Unfold' : 'Fold'} Better Angels paper model`);
      stage.setAttribute('aria-pressed', String(folded));
      fold.textContent = folded ? 'unfold' : 'fold';
      flip.textContent = flipped ? 'outside' : 'flip';
    }
    stage.addEventListener('click', () => { folded = !folded; sync(); });
    sync();
    view.append(stage);
    return {media: view, actions};
  }

  function renderArtwork(item, project, ci, si) {
    const figure = create('figure', 'gallery-item');
    const media = create('div', 'gallery-item-media');
    const heading = create('figcaption', 'gallery-item-caption');
    heading.append(create('strong', '', item.title || project.chapters[ci].title));
    if (item.description) heading.append(create('span', 'art-description', item.description));
    let actions = create('div', 'item-actions');
    const enlarge = (src, alt) => openLarge(src, alt);

    if (item.type === 'image') {
      const button = create('button', 'art-image');
      button.type = 'button';
      button.setAttribute('aria-label', `Enlarge ${item.title}`);
      button.append(image(previewSrc(project,ci,si,'main',item.src),item.alt));
      button.addEventListener('click', () => enlarge(item.src, item.alt));
      media.append(button);
    } else if (item.type === 'switch') {
      let back = false;
      const button = create('button', 'art-image');
      button.type = 'button';
      const img = image(previewSrc(project,ci,si,'front',item.front), item.alt);
      button.append(img);
      const toggle = control('in use', () => {
        back = !back;
        img.src = previewSrc(project,ci,si,back?'back':'front',back?item.back:item.front);
        img.alt = back ? `${item.title} in use` : item.alt;
        toggle.textContent = back ? 'artwork' : 'in use';
        toggle.setAttribute('aria-pressed', String(back));
      });
      toggle.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `Switch views of ${item.title}`);
      button.addEventListener('click', () => toggle.click());
      actions.append(toggle,control('enlarge', () => enlarge(back?item.back:item.front,img.alt)));
      media.append(button);
    } else if (item.type === 'flip') {
      let flipped = false;
      const button = create('button', 'art-image flip-image');
      button.type = 'button';
      const inner = create('div', 'flip-inner');
      const front = create('div', 'flip-face front');
      const back = create('div', 'flip-face back');
      front.append(image(previewSrc(project,ci,si,'front',item.front),item.alt));
      back.append(image(previewSrc(project,ci,si,'back',item.back),`${item.title} reverse side`));
      inner.append(front,back);
      button.append(inner);
      const toggle = control('flip', () => {
        flipped = !flipped;
        inner.classList.toggle('is-flipped',flipped);
        toggle.textContent = flipped ? 'front' : 'flip';
        toggle.setAttribute('aria-pressed',String(flipped));
      });
      toggle.setAttribute('aria-pressed','false');
      button.setAttribute('aria-label', `Flip ${item.title}`);
      button.addEventListener('click', () => toggle.click());
      actions.append(toggle,control('enlarge', () => enlarge(flipped?item.back:item.front,flipped?`${item.title} reverse side`:item.alt)));
      media.append(button);
    } else if (item.type === 'folder') {
      const folder = folderMedia();
      media.append(folder.media);
      actions = folder.actions;
    }

    figure.append(media,heading);
    if (actions.children.length) figure.append(actions);
    return figure;
  }

  function renderProject() {
    const project = projects[projectIndex];
    $('study-title').textContent = project.title;
    $('study-tagline').textContent = project.tagline;
    gallery.replaceChildren();
    const detail = $('project-notes');
    detail.open = false;
    const detailContent = $('project-notes-copy');
    detailContent.replaceChildren();
    let haveDetails = false;
    for (const chapter of project.chapters) {
      if (!chapter.notes && !chapter.credits) continue;
      haveDetails = true;
      if (project.chapters.length > 1) detailContent.append(create('h3','',chapter.title));
      const copy = create('div','notes-copy');
      copy.innerHTML = [chapter.notes,chapter.credits].filter(Boolean).join('');
      detailContent.append(copy);
    }
    detail.hidden = !haveDetails;
    project.chapters.forEach((chapter, ci) => {
      const section = create('section', 'gallery-section');
      const titleSide = create('div', 'gallery-section-copy');
      if (project.chapters.length > 1) titleSide.append(create('h3', '', chapter.title));
      if (chapter.summary && chapter.summary !== project.tagline) titleSide.append(create('p','',chapter.summary));
      const items = create('div','gallery-items');
      chapter.slides.forEach((slide,si) => items.append(renderArtwork(slide,project,ci,si)));
      section.append(titleSide,items);
      gallery.append(section);
    });
  }

  function navigateUrl(replace) {
    const url = projectIndex < 0 ? '/design/' : `/design/#${projects[projectIndex].id}`;
    history[replace ? 'replaceState' : 'pushState'](null,'',url);
  }
  function openProject(idx,fromUrl=false) {
    projectIndex = idx;
    overview.hidden = true;
    study.hidden = false;
    renderProject();
    if (!fromUrl) navigateUrl(false);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function closeProject(fromUrl=false) {
    projectIndex = -1;
    study.hidden = true;
    overview.hidden = false;
    if (!fromUrl) navigateUrl(false);
    window.scrollTo({top:0,behavior:'instant'});
  }
  $('all-work').addEventListener('click',() => closeProject());
  document.addEventListener('keydown',(event) => { if (event.key === 'Escape' && !study.hidden && !artDialog.open) closeProject(); });
  function readHash() {
    const slug = location.hash.slice(1).split('/')[0];
    const idx = projects.findIndex((p) => p.id === slug);
    if (idx >= 0) openProject(idx,true);
    else if (projectIndex >= 0) closeProject(true);
  }
  window.addEventListener('popstate',readHash);
  showPreview(0);
  readHash();

  const wip = $('wip-dialog');
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('keegan-biz-design-wip-dismissed') === '1'; } catch (_) {}
  if (wip && !dismissed && wip.showModal) {
    wip.querySelector('[data-wip-dismiss]')?.addEventListener('click',() => wip.close());
    wip.addEventListener('click',(event) => { if (event.target === wip) wip.close(); });
    wip.addEventListener('close',() => {
      try { sessionStorage.setItem('keegan-biz-design-wip-dismissed','1'); } catch (_) {}
    });
    wip.showModal();
  }
})();
