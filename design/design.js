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
  let lightboxIndex = -1;
  let lightboxItems = [];

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

  // The original source image is used in the lightbox, without interpolation past its pixel size.
  function showLightboxImage() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    dialogImage.style.maxWidth = '';
    dialogImage.style.maxHeight = '';
    dialogImage.src = item.src;
    dialogImage.alt = item.alt || item.title;
    dialogCaption.textContent = item.title;
    const syncNativeSize = () => {
      if (dialogImage.src !== new URL(item.src, location.href).href) return;
      dialogImage.style.maxWidth = `${dialogImage.naturalWidth}px`;
      dialogImage.style.maxHeight = `${dialogImage.naturalHeight}px`;
    };
    if (dialogImage.complete && dialogImage.naturalWidth) syncNativeSize();
    else dialogImage.onload = syncNativeSize;
    byId('art-dialog-prev').disabled = lightboxIndex === 0;
    byId('art-dialog-next').disabled = lightboxIndex === lightboxItems.length - 1;
  }
  function openLarge(src, alt, title) {
    if (!src || !dialog?.showModal) return;
    let found = lightboxItems.findIndex(it => it.src === src);
    if (found < 0) {
      lightboxItems.push({src, alt, title: title || alt || 'Artwork'});
      found = lightboxItems.length - 1;
    }
    lightboxIndex = found;
    showLightboxImage();
    if (!dialog.open) dialog.showModal();
  }
  function moveLightbox(amount) {
    const next = lightboxIndex + amount;
    if (next < 0 || next >= lightboxItems.length) return;
    lightboxIndex = next;
    showLightboxImage();
  }
  byId('art-dialog-prev').addEventListener('click', () => moveLightbox(-1));
  byId('art-dialog-next').addEventListener('click', () => moveLightbox(1));
  byId('art-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { dialogImage.removeAttribute('src'); dialogImage.onload = null; });

  // Preserved existing fold model. Its geometry will be addressed separately.
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
    const flip = button('inside', () => { flipped = !flipped; sync(); });
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
    return {node:view, actions};
  }

  function registerLightbox(src, alt, title) {
    if (!lightboxItems.some(it => it.src === src)) lightboxItems.push({src, alt, title});
  }
  function renderArtwork(item) {
    const figure = el('figure', `gallery-item gallery-item--${item.type}`);
    const media = el('div', 'gallery-item-media');
    const caption = el('figcaption', 'gallery-item-caption');
    caption.append(el('strong', '', item.title));
    if (item.description) caption.append(el('span', 'art-description', item.description));
    const actions = el('div', 'item-actions');
    const wide = /ear hustle|bus wrap|event banner/i.test(item.title);
    if (wide) figure.classList.add('gallery-item--wide');

    if (item.type === 'image') {
      registerLightbox(item.src, item.alt, item.title);
      const zoom = button('', () => openLarge(item.src, item.alt, item.title), 'art-image');
      zoom.setAttribute('aria-label', `Enlarge ${item.title}`);
      zoom.append(picture(item.src, item.alt));
      media.append(zoom);
    } else if (item.type === 'switch' || item.type === 'flip') {
      let pinned = false;
      registerLightbox(item.front, item.alt, item.title);
      registerLightbox(item.back, `${item.title}, ${item.type === 'switch' ? 'photographed in use' : 'reverse side'}`, item.title);
      media.classList.add('has-reverse', `has-reverse--${item.type}`);
      const imageButton = el('button', 'art-image');
      imageButton.type = 'button';
      imageButton.setAttribute('aria-label', `${item.type === 'switch' ? 'Compare' : 'Flip'} ${item.title}`);
      if (item.type === 'switch') {
        const front = picture(item.front, item.alt);
        const back = picture(item.back, `${item.title} photographed in use`);
        front.className = 'state-primary';
        back.className = 'state-secondary';
        imageButton.append(front, back);
      } else {
        const inner = el('div', 'flip-inner');
        const front = el('div', 'flip-face front');
        const back = el('div', 'flip-face back');
        front.append(picture(item.front, item.alt));
        back.append(picture(item.back, `${item.title}, reverse side`));
        inner.append(front, back);
        imageButton.append(inner);
      }
      const toggle = button(item.type === 'switch' ? 'in use' : 'flip', () => {
        pinned = !pinned;
        media.classList.toggle('is-pinned', pinned);
        toggle.textContent = pinned ? (item.type === 'switch' ? 'artwork' : 'front') : (item.type === 'switch' ? 'in use' : 'flip');
        toggle.setAttribute('aria-pressed', String(pinned));
      });
      toggle.setAttribute('aria-pressed', 'false');
      imageButton.addEventListener('click', () => toggle.click());
      const getSource = () => {
        const hover = matchMedia('(hover: hover) and (pointer: fine)').matches && media.matches(':hover');
        return (pinned || hover) ? item.back : item.front;
      };
      actions.append(toggle, button('enlarge', () => openLarge(getSource(), item.alt, item.title)));
      media.append(imageButton);
    } else if (item.type === 'folder') {
      registerLightbox('/design/assets/better%20angels%20takeaway%20outside.png', 'Foldout takeaway outside', 'Foldout takeaway');
      registerLightbox('/design/assets/better%20angels%20takeaway%20inside.png', 'Foldout takeaway inside', 'Foldout takeaway');
      const foldout = makeFoldout();
      media.append(foldout.node);
      actions.append(...foldout.actions.children);
      actions.append(button('enlarge', () => openLarge('/design/assets/better%20angels%20takeaway%20outside.png', 'Foldout takeaway', 'Foldout takeaway')));
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

  function isCarousel(project, chapter) {
    if (project.id === 'winter' || chapter.slides.length <= 2) return false;
    if (project.id === 'college' && chapter.title === 'Trinity FM') return false;
    return chapter.slides.length > 2;
  }
  function setupCarousel(track, previous, next) {
    const cards = [...track.children];
    const getIndex = () => {
      const left = track.scrollLeft;
      let best = 0;
      cards.forEach((card, i) => {
        if (Math.abs(card.offsetLeft - left) < Math.abs(cards[best].offsetLeft - left)) best = i;
      });
      return best;
    };
    const update = () => {
      const end = track.scrollWidth - track.clientWidth - 2;
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= end;
    };
    function move(direction) {
      if (!cards.length) return;
      const targetIndex = Math.max(0, Math.min(cards.length - 1, getIndex() + direction));
      track.scrollTo({left: cards[targetIndex].offsetLeft - cards[0].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update, {passive: true, once: true});
    requestAnimationFrame(update);
    track.addEventListener('keydown', e => {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    });
  }

  function renderProject() {
    const project = projects[projectIndex];
    study.dataset.project = project.id;
    byId('study-title').textContent = project.title;
    byId('study-tagline').textContent = project.tagline;
    gallery.replaceChildren();
    lightboxItems = [];
    renderStory(project);
    project.chapters.forEach((chapter, chapterIndex) => {
      const section = el('section', 'gallery-section');
      section.dataset.chapter = String(chapterIndex);
      const copy = el('div', 'gallery-section-copy');
      copy.append(el('h3', '', chapter.title));
      if (chapter.summary && chapter.summary !== project.tagline) copy.append(el('p', '', chapter.summary));
      const items = el('div', 'gallery-items');
      items.setAttribute('aria-label', `${chapter.title} artwork`);
      chapter.slides.forEach(item => items.append(renderArtwork(item)));
      const carousel = isCarousel(project, chapter);
      if (carousel) {
        items.classList.add('gallery-items--carousel');
        items.tabIndex = 0;
        const controls = el('div', 'gallery-controls');
        const previous = button('previous', () => {}, 'gallery-previous');
        const next = button('next', () => {}, 'gallery-next');
        controls.append(previous, next);
        copy.append(controls);
        section.append(copy, items);
        gallery.append(section);
        setupCarousel(items, previous, next);
      } else {
        items.classList.add(chapter.slides.length === 1 ? 'gallery-items--solo' : 'gallery-items--static');
        section.append(copy, items);
        gallery.append(section);
      }
    });
    const footer = el('div', 'study-footer');
    footer.append(button('all projects', () => closeProject(), 'text-action'), button(`next project  +`, () => openProject((projectIndex + 1) % projects.length), 'text-action'));
    gallery.append(footer);
  }

  function updateUrl() {
    history.pushState(null, '', projectIndex === -1 ? '/design/' : `/design/#${projects[projectIndex].id}`);
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
      else if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
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
