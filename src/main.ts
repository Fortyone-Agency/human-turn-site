import './site.css';

document.querySelectorAll<HTMLElement>('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const languageMenu = document.querySelector<HTMLDetailsElement>('.language-menu');
document.addEventListener('click', (event) => {
  if (event.target instanceof Node && !languageMenu?.contains(event.target)) {
    languageMenu?.removeAttribute('open');
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && languageMenu?.open) {
    languageMenu.open = false;
    languageMenu.querySelector('summary')?.focus();
  }
});

const galleryImage = document.querySelector<HTMLImageElement>('#gallery-image');
const galleryCaption = document.querySelector<HTMLElement>('#gallery-caption');
const enlargeLink = document.querySelector<HTMLAnchorElement>('[data-enlarge]');
const lightbox = document.querySelector<HTMLDialogElement>('.lightbox');
const lightboxImage = lightbox?.querySelector<HTMLImageElement>('img');
const shots = [...document.querySelectorAll<HTMLAnchorElement>('[data-shot]')];

function selectShot(shot: HTMLAnchorElement) {
  if (!galleryImage || !galleryCaption || !enlargeLink) return;
  galleryImage.src = shot.href;
  galleryImage.alt = shot.dataset.alt || '';
  galleryCaption.textContent = shot.textContent;
  enlargeLink.href = shot.href;
  shots.forEach((item) => {
    if (item === shot) item.setAttribute('aria-current', 'true');
    else item.removeAttribute('aria-current');
  });
}

shots.forEach((shot, index) => {
  shot.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectShot(shot);
  });
  shot.addEventListener('keydown', (event) => {
    let nextIndex: number;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % shots.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + shots.length) % shots.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = shots.length - 1;
    else return;
    event.preventDefault();
    const nextShot = shots[nextIndex];
    selectShot(nextShot);
    nextShot.focus();
  });
});

enlargeLink?.addEventListener('click', (event) => {
  if (!lightbox || !lightboxImage || !galleryImage || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  lightboxImage.src = galleryImage.src;
  lightboxImage.alt = galleryImage.alt;
  lightbox.showModal();
});

lightbox?.addEventListener('click', (event) => {
  if (event.target !== lightbox) return;
  const bounds = lightbox.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
});

lightbox?.addEventListener('close', () => enlargeLink?.focus());