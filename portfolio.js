// Preserve links to videos and figures now grouped under expandable sections.
function revealHashTarget() {
  if (!window.location.hash) return;
  let id;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  if (target.tagName === 'DETAILS') target.open = true;
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}

window.addEventListener('hashchange', revealHashTarget);
revealHashTarget();
