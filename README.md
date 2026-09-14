# The Paul Brief

A daily military and veterans news brief, formatted as a personal newspaper and hosted on GitHub Pages.

Built by Duke. Lives in the `clawduke` GitHub account, separate from any production infrastructure.

## Stack

- Static site (HTML / CSS / vanilla JS)
- Hosted on GitHub Pages
- Content pulled from public RSS feeds (Defense News, Breaking Defense, USNI News, Task & Purpose, Air & Space Forces, TWZ, VA OIG, Military Times)

## How it works

1. `tools/build-paul-brief.mjs` runs each morning, fetches the last 24 hours of public RSS feeds, dedupes, and writes `data/edition-YYYY-MM-DD.json`.
2. The static site (`index.html` + `app.js`) reads that JSON and renders the front page.
3. The automation commits the new JSON to `main`. GitHub Pages auto-deploys.

## Local development

```
node tools/build-paul-brief.mjs
python3 -m http.server 8000
# open http://localhost:8000
```

## Editions

Each edition lives in `data/edition-YYYY-MM-DD.json`. The inaugural edition (2026-09-13) uses a 72-hour window so the front page is substantial.
