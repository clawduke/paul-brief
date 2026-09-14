// The Paul Brief — fetches today's edition JSON and renders the front page.
// For the inaugural edition we load the static edition file. When the
// automation publishes a fresh daily edition, this can be pointed at a
// manifest of all editions.

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

function sourceLabel(url) {
  if (!url) return '';
  return SOURCE_LABELS[url] || (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
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

function card(item) {
  return `
    <article class="card">
      <h3><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h3>
      ${item.summary ? `<p class="summary">${escapeHtml(item.summary)}</p>` : ''}
      <div class="byline">${byline(item)}</div>
    </article>
  `;
}

async function loadEdition() {
  const res = await fetch('data/edition-2026-09-13.json', { cache: 'no-store' });
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
        <h2><a href="${escapeHtml(lead.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.title)}</a></h2>
        ${lead.summary ? `<p class="summary">${escapeHtml(lead.summary)}</p>` : ''}
        <div class="byline">${byline(lead)}</div>
      </div>
      <aside class="rail">
        ${rail.map(card).join('')}
      </aside>
    `;

    document.getElementById('grid').innerHTML = main.map(card).join('');
    document.getElementById('wires').innerHTML = wires.map(card).join('');
  } catch (err) {
    document.getElementById('lede').innerHTML = `<p>Error loading today's edition: ${escapeHtml(err.message)}</p>`;
  }
})();
