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
    const number = link.querySelector('.shortcut-number').textContent;
    const title = link.querySelector('strong').textContent;
    // The last tab, 그 밖의 프로젝트, is marked "+" instead of a number.
    name.textContent = /\d/.test(number) ? `${number} ${title}` : title;
    item.append(hint, name);
    pager.append(item);
  });
  project.append(pager);
}

if (tabbed) {
  const section = projectNav.closest('.projects-section');
  section.classList.add('is-tabbed');
  // Anchors inside a project scroll clear of the sticky switcher. Set it now as well,
  // so a direct link on first load does not scroll before the observer reports.
  const setSwitcherHeight = () => section.style.setProperty('--switcher', `${projectNav.offsetHeight}px`);
  setSwitcherHeight();
  new ResizeObserver(setSwitcherHeight).observe(projectNav);
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

// Inside 그 밖의 프로젝트, small buttons show one summary card at a time.
const sideNav = document.querySelector('.side-tabs');
const sideLinks = sideNav ? [...sideNav.querySelectorAll('a[href^="#"]')] : [];
const sideCards = sideLinks.map(link => document.getElementById(link.hash.slice(1)));
const sideTabbed = tabbed && sideCards.length > 0 && sideCards.every(Boolean);

function showSideCard(card) {
  sideCards.forEach((item, index) => {
    if (item === card) {
      item.removeAttribute('hidden');
      sideLinks[index].setAttribute('aria-current', 'true');
      return;
    }
    item.setAttribute('hidden', 'until-found');
    sideLinks[index].removeAttribute('aria-current');
  });
}

if (sideTabbed) {
  sideNav.closest('.side-projects').classList.add('is-side-tabbed');
  sideCards.forEach(card => card.addEventListener('beforematch', () => showSideCard(card)));
  showSideCard(sideCards[0]);
  sideNav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showSideCard(document.getElementById(link.hash.slice(1)));
    history.replaceState(null, '', link.hash);
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
  const card = sideTabbed ? target.closest('.side-card') : null;
  if (card?.hidden) {
    showSideCard(card);
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
