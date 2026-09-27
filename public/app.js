/*
 * Time filter notes (Google `tbs=qdr:`):
 *
 * Google only documents qdr:h, qdr:d, qdr:w, qdr:m, qdr:y. An undocumented but
 * widely reported extension appends a number directly after the unit letter:
 * qdr:h6 = past 6 hours, qdr:d3 = past 3 days, qdr:w2 = past 2 weeks.
 * The colon form (qdr:h:6) is NOT a known format, so we don't use it.
 *
 * This could not be tested live from the build environment (Google served a
 * CAPTCHA). Because it's undocumented, Google may ignore the number and use
 * the plain bucket instead. The UI caption under the dropdown says so.
 * `sbd:1` sorts by date instead of relevance.
 */
const TIME_OPTIONS = [
  { label: 'Past 6 hours', qdr: 'h6' },
  { label: 'Past 8 hours', qdr: 'h8' },
  { label: 'Past 12 hours', qdr: 'h12' },
  { label: 'Past 24 hours', qdr: 'd' }, // documented value, identical to h24
  { label: 'Past 2 days', qdr: 'd2' },
  { label: 'Past 3 days', qdr: 'd3' },
  { label: 'Past 4 days', qdr: 'd4' },
  { label: 'Past 5 days', qdr: 'd5' },
  { label: 'Past 6 days', qdr: 'd6' },
  { label: 'Past 1 week', qdr: 'w' },
  { label: 'Past 2 weeks', qdr: 'w2' },
  { label: 'Past 3 weeks', qdr: 'w3' },
];
const DEFAULT_TIME = 'd';

const BOARDS = [
  { name: 'Lever', sites: ['lever.co'] },
  { name: 'Greenhouse', sites: ['greenhouse.io', 'job-boards.greenhouse.io'] },
  { name: 'Ashby', sites: ['jobs.ashbyhq.com'] },
  { name: 'Workable', sites: ['apply.workable.com'] },
  { name: 'SmartRecruiters', sites: ['jobs.smartrecruiters.com'] },
  { name: 'Rippling', sites: ['ats.rippling.com'] },
  { name: 'Gem', sites: ['jobs.gem.com'] },
  { name: 'BambooHR', sites: ['bamboohr.com/careers'] },
  { name: 'Breezy', sites: ['breezy.hr'] },
  { name: 'Recruitee', sites: ['recruitee.com'] },
  { name: 'Workday', sites: ['myworkdayjobs.com'] },
  { name: 'iCIMS', sites: ['icims.com'] },
  { name: 'Jobvite', sites: ['jobs.jobvite.com'] },
];

const LOCATIONS = {
  remote: '"remote"',
  // Job posts phrase Boston inconsistently, so match any of these.
  boston: '("Boston, Massachusetts" OR "Boston, MA" OR "Boston MA" OR "Boston")',
};

const EXCLUSIONS = '-jobgether -talent.com';

// Google ignores query terms past 32 words, so "Search All" is split into
// several queries that each stay under the limit. OR and site: terms count.
const MAX_WORDS = 32;

const $ = (id) => document.getElementById(id);
const titleInput = $('title');
const titleError = $('title-error');
const postedSelect = $('posted');

for (const opt of TIME_OPTIONS) {
  postedSelect.add(new Option(opt.label, opt.qdr, false, opt.qdr === DEFAULT_TIME));
}

function wordCount(s) {
  return s.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function siteClause(sites) {
  const parts = sites.map((s) => `site:${s}`);
  return parts.length > 1 ? `(${parts.join(' OR ')})` : parts[0];
}

function buildQuery(title, sites, location) {
  const phrase = `"${title.replace(/"/g, '')}"`;
    return [phrase, siteClause(sites), LOCATIONS[location]].join(' ');
}

function buildUrl(query, qdr) {
  const params = new URLSearchParams({ q: query, tbs: `qdr:${qdr},sbd:1` });
  return `https://www.google.com/search?${params}`;
}

// Greedily pack all site filters into as few queries as fit under MAX_WORDS.
function chunkSites(title, location) {
  const allSites = BOARDS.flatMap((b) => b.sites);
  const chunks = [];
  let current = [];
  for (const site of allSites) {
    const next = [...current, site];
    if (current.length && wordCount(buildQuery(title || 'x', next, location)) > MAX_WORDS) {
      chunks.push(current);
      current = [site];
    } else {
      current = next;
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function makeLink(label, getSites, extraClass) {
  const a = document.createElement('a');
  a.className = `btn ${extraClass || ''}`.trim();
  a.textContent = label;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.dataset.sites = JSON.stringify(getSites);
  return a;
}

const boardLinks = BOARDS.map((b) => {
  const a = makeLink(b.name, b.sites);
  $('boards').append(a);
  return a;
});

function state() {
  return {
    title: titleInput.value.trim(),
    location: document.querySelector('input[name="location"]:checked').value,
    qdr: postedSelect.value,
  };
}

function render() {
  const { title, location, qdr } = state();

  for (const a of boardLinks) {
    a.href = buildUrl(buildQuery(title, JSON.parse(a.dataset.sites), location), qdr);
  }

  const chunks = chunkSites(title, location);
  const all = $('all');
  all.replaceChildren(
    ...chunks.map((sites, i) => {
      const label = chunks.length > 1 ? `Search All (${i + 1}/${chunks.length})` : 'Search All';
      const a = makeLink(label, sites, 'btn-primary');
      a.href = buildUrl(buildQuery(title, sites, location), qdr);
      return a;
    })
  );
  $('all-note').textContent = chunks.length > 1
    ? `Split into ${chunks.length} searches to stay under Google's ${MAX_WORDS}-word query limit.`
    : '';

  if (title) titleError.hidden = true;
}

// Block navigation when the title is empty.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a.btn');
  if (!a) return;
  if (!state().title) {
    e.preventDefault();
    titleError.hidden = false;
    titleInput.setAttribute('aria-invalid', 'true');
    titleInput.focus();
  } else {
    titleInput.removeAttribute('aria-invalid');
  }
});

$('form').addEventListener('input', render);
$('form').addEventListener('change', render);
$('form').addEventListener('submit', (e) => e.preventDefault());
render();
