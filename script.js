// Show one project at a time; the shortcut cards switch between them.
// Without JavaScript every project stays on the page in order.
const projectNav = document.querySelector('.project-shortcuts');
const projectLinks = projectNav ? [...projectNav.querySelectorAll('a[href^="#"]')] : [];
const projects = projectLinks.map(link => document.getElementById(link.hash.slice(1)));
const tabbed = projects.length > 0 && projects.every(Boolean);

function showProject(project) {
  projects.forEach((item, index) => {
    if (item === project) {
      item.removeAttribute('hidden');
      projectLinks[index].setAttribute('aria-current', 'true');
      return;
    }
    item.querySelectorAll('video').forEach(video => video.pause());
    // until-found keeps hidden projects reachable by the browser's find in page.
    item.setAttribute('hidden', 'until-found');
    projectLinks[index].removeAttribute('aria-current');
  });
}

// Switching from the middle of a long project starts the next one at its title.
function scrollToProjectStart(project) {
  const offset = project.getBoundingClientRect().top - projectNav.getBoundingClientRect().bottom;
  if (offset < 0) window.scrollBy({ top: offset, behavior: 'instant' });
}

function addProjectPager(project, index) {
  const pager = document.createElement('nav');
  pager.className = 'project-pager';
  pager.setAttribute('aria-label', '이전, 다음 프로젝트');
  [[index - 1, 'prev', '← 이전 프로젝트'], [index + 1, 'next', '다음 프로젝트 →']].forEach(([target, direction, label]) => {
    const link = projectLinks[target];
    if (!link) return;
    const item = document.createElement('a');
    item.href = link.hash;
    item.className = `pager-${direction}`;
    const hint = document.createElement('span');
    hint.textContent = label;
    const name = document.createElement('strong');
    name.textContent = `${link.querySelector('.shortcut-number').textContent} ${link.querySelector('strong').textContent}`;
    item.append(hint, name);
    pager.append(item);
  });
  project.append(pager);
}

if (tabbed) {
  const section = projectNav.closest('.projects-section');
  section.classList.add('is-tabbed');
  // Anchors inside a project scroll clear of the sticky switcher.
  new ResizeObserver(() => section.style.setProperty('--switcher', `${projectNav.offsetHeight}px`)).observe(projectNav);
  projects.forEach((project, index) => {
    addProjectPager(project, index);
    project.addEventListener('beforematch', () => showProject(project));
  });
  showProject(projects[0]);
  document.addEventListener('click', event => {
    const link = event.target.closest('.project-shortcuts a, .project-pager a');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const project = document.getElementById(link.hash.slice(1));
    showProject(project);
    history.replaceState(null, '', link.hash);
    scrollToProjectStart(project);
  });
}

// A direct link can point inside a closed project disclosure or a hidden project.
// On first load it re-scrolls too: hiding the other projects moves everything after them.
function revealHashTarget(event) {
  if (!location.hash) return;
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
  catch { return; }
  if (!target) return;
  let parent = target.parentElement;
  let revealed = false;
  const project = tabbed ? target.closest('.project') : null;
  if (project?.hidden) {
    showProject(project);
    revealed = true;
  }
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
  if (revealed || !event) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
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
