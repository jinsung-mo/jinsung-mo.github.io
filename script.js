// A direct link can point inside a closed project disclosure.
function revealHashTarget() {
  if (!location.hash) return;
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
  catch { return; }
  if (!target) return;
  let parent = target.parentElement;
  let revealed = false;
  if (target instanceof HTMLDetailsElement && !target.open) {
    target.open = true;
    revealed = true;
  }
  while (parent) {
    if (parent instanceof HTMLDetailsElement && !parent.open) {
      parent.open = true;
      revealed = true;
    }
    parent = parent.parentElement;
  }
  if (revealed) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', revealHashTarget);
revealHashTarget();

document.querySelectorAll('.media-detail').forEach(disclosure => {
  disclosure.addEventListener('toggle', () => {
    if (!disclosure.open) disclosure.querySelectorAll('video').forEach(video => video.pause());
  });
});

document.querySelectorAll('.project-detail').forEach(disclosure => {
  const hint = disclosure.querySelector('.summary-hint');
  const updateHint = () => { if (hint) hint.textContent = disclosure.open ? '접기' : '펼쳐 보기'; };
  disclosure.addEventListener('toggle', updateHint);
  updateHint();
});

document.querySelector('.print-button')?.addEventListener('click', () => window.print());
let printState = [];
window.addEventListener('beforeprint', () => {
  printState = [...document.querySelectorAll('.project-detail:not(.media-detail)')]
    .map(disclosure => ({ disclosure, open: disclosure.open }));
  printState.forEach(({ disclosure }) => { disclosure.open = true; });
});
window.addEventListener('afterprint', () => {
  printState.forEach(({ disclosure, open }) => { disclosure.open = open; });
  printState = [];
});
