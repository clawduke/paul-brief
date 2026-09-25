// The Paul Brief — fetches today's edition JSON and renders the front page.
// When the automation publishes a fresh daily edition, app.js points at
// `data/edition-YYYY-MM-DD.json` for the current date.

const SOURCE_LABELS = {
  'https://breakingdefense.com/feed/': 'Breaking Defense',
  'https://news.usni.org/feed': 'USNI News',
  'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml': 'Defense News',
  'https://www.militarytimes.com/arc/outboundfeeds/rss/?outputType=xml': 'Military Times',
  'https://taskandpurpose.com/feed/': 'Task & Purpose',
  'https://www.airandspaceforces.com/feed/': 'Air & Space Forces',
  'https://www.twz.com/feed': 'TWZ',
  'https://www.vaoig.gov/rss.xml': 'VA OIG',
  'https://www.militarytimes.com/arc/outboundfeeds/rss/category/veterans/?outputType=xml': 'Military Times · Veterans',
};

// Brand colors for fallback cards (story had no scrapable hero image).
// Muted, ink-friendly tones so the layout reads as intentional, not missing.
const SOURCE_BRAND = {
  'news.usni.org': { bg: '#1f3a5f', fg: '#f0f4f8' },          // USNI navy
  'www.defensenews.com': { bg: '#3a3a3a', fg: '#f5f5f5' },   // Defense News slate
  'www.militarytimes.com': { bg: '#2c5530', fg: '#f0f5f0' }, // Military Times green
  'taskandpurpose.com': { bg: '#8b3a3a', fg: '#faf0f0' },    // Task & Purpose red
  'www.airandspaceforces.com': { bg: '#1f4e4a', fg: '#f0f5f4' }, // AFA teal
  'www.twz.com': { bg: '#5c4a2e', fg: '#faf6ee' },           // TWZ tan
  'breakingdefense.com': { bg: '#4a3a2e', fg: '#faf6f0' },   // Breaking Defense brown
  'www.vaoig.gov': { bg: '#3a4a5c', fg: '#f0f4f8' },         // VA OIG blue-gray
};

function sourceLabel(url) {
  if (!url) return '';
  return SOURCE_LABELS[url] || (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
}

function sourceBrand(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SOURCE_BRAND[host] || null;
  } catch {
    return null;
  }
}

function timeOfDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
}

function byline(item) {
  const parts = [];
  parts.push(`<span class="source">${sourceLabel(item.source)}</span>`);
  if (item.author) parts.push(`<span class="sep">·</span><span>By ${escapeHtml(item.author)}</span>`);
  if (item.publishedAt) parts.push(`<span class="sep">·</span><span>${timeOfDay(item.publishedAt)} PT</span>`);
  return parts.join(' ');
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fallbackBlock(item) {
  const brand = sourceBrand(item.source) || { bg: '#2a2a2a', fg: '#f5f5f5' };
  const label = sourceLabel(item.source) || 'Source';
  return `<a class="img-link fallback" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
    <div class="hero fallback-hero" style="background:${brand.bg};color:${brand.fg};">
      <span class="fallback-label">${escapeHtml(label)}</span>
    </div>
  </a>`;
}

function imageTag(item) {
  if (item.image) {
    return `<a class="img-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
      <img class="hero" src="${escapeHtml(item.image)}" alt="" loading="lazy" />
    </a>`;
  }
  return fallbackBlock(item);
}

function card(item, { withImage = true } = {}) {
  return `
    <article class="card">
      ${withImage ? imageTag(item) : ''}
      <h3><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h3>
      ${item.summary ? `<p class="summary">${escapeHtml(item.summary)}</p>` : ''}
      <div class="byline">${byline(item)}</div>
    </article>
  `;
}

async function loadEdition() {
  const res = await fetch('data/edition-2026-09-25.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('failed to load edition');
  return res.json();
}

(async () => {
  try {
    const edition = await loadEdition();
    const items = edition.items || [];
    if (items.length === 0) {
      document.getElementById('lede').innerHTML = '<p>No stories available for today.</p>';
      return;
    }

    const lead = items[0];
    const rail = items.slice(1, 4);
    const main = items.slice(4, 10);
    const wires = items.slice(10);

    document.getElementById('lede').innerHTML = `
      <div class="main">
        ${imageTag(lead)}
        <h2><a href="${escapeHtml(lead.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.title)}</a></h2>
        ${lead.summary ? `<p class="summary">${escapeHtml(lead.summary)}</p>` : ''}
        <div class="byline">${byline(lead)}</div>
      </div>
      <aside class="rail">
        ${rail.map((it) => card(it, { withImage: true })).join('')}
      </aside>
    `;

    document.getElementById('grid').innerHTML = main.map((it) => card(it, { withImage: true })).join('');
    document.getElementById('wires').innerHTML = wires.map((it) => card(it, { withImage: false })).join('');
  } catch (err) {
    document.getElementById('lede').innerHTML = `<p>Error loading today's edition: ${escapeHtml(err.message)}</p>`;
  }
})();
