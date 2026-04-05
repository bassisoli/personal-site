# Docs for Claude — Personal Site

## Site Overview
Christian Hales' personal website, modeled after [patrickcollison.com](http://patrickcollison.com).

## File Location
`/Users/christian/personal-site/`

## Live URL
`https://christianhales.com`

## GitHub Repo
`https://github.com/bassisoli/personal-site`

## Hosting
GitHub Pages + Cloudflare custom domain. After pushing to git, Cloudflare may cache old content — purge at [dash.cloudflare.com](http://dash.cloudflare.com) → Caching → Purge Everything if changes don't appear.

---

## Current Navigation
- /ideas
- /writing
- /travel/india-2025

All other pages exist as empty `index.html` files — ignore them, they are placeholders with no content.

**IMPORTANT:** Any change to the nav must be applied to every live page listed above, plus any subpages (e.g. `/writing/under-new-management`). They each have their own copy of the nav — there is no shared template.

---

## Design Reference (from patrickcollison.com)

### Layout
Three-column float layout:
1. `#left` — 200px invisible spacer (float left), contains `&nbsp;`
2. `#content` — 500px content area (float left)
3. `#menu` — 150px nav (float right, margin-right: 20px)

### Menu HTML structure
```html
<div id="menu">
<a href="/" class="title">Christian Hales</a>
<ul>
  <li><a href="/ideas">Ideas</a></li>
  <li><a href="/writing">Writing</a></li>
  <li><a href="/travel/india-2025">India 2025</a></li>
</ul>
</div>
```

### Typography
- Body: Helvetica 15px
- Body text: #333, line-height 18px
- Links: #0864c7, underlined

### CSS path by location
- Root pages (`index.html`): `style.css`
- All subdirectories (`/writing/`, `/ideas/`, etc.): `../style.css`
- Two levels deep (`/writing/under-new-management/`): `../../style.css`

---

## Ideas Page (`/ideas`)
A random idea generator. 282 startup/creative ideas baked into the page as a JS array.

### Global 12-hour deduplication
Tracked via Cloudflare Workers + KV.

**Worker:** `ideas-api` at `christianhales.com/ideas-api`
- `GET /ideas-api` → returns array of recently-shown idea IDs
- `POST /ideas-api` with `{"id": 42}` → marks idea shown, TTL 43200s (12 hours)

**KV namespace:** `IDEAS_KV` bound to the worker

**To reset (clear all shown ideas):**
Cloudflare → Storage & Databases → KV → IDEAS_KV → KV Pairs → select all → delete

---

## Deploying Changes
Run from `/Users/christian/personal-site/`:
```
./deploy.sh "commit message"
```
This commits, pushes, and purges the Cloudflare cache automatically.

Credentials in `/Users/christian/Claude_code/.env`: `CLOUDFLARE_TOKEN`, `CLOUDFLARE_ZONE_ID`

---

## Sync Skill (`/sync-site`)
When user runs `/sync-site`, Claude:
1. Fetches About, Writing, Projects, Case Studies pages from Notion via MCP
2. Converts blocks to HTML
3. Writes files to `/Users/christian/personal-site/`
4. Runs `git add . && git commit -m "Sync from Notion" && git push`

The ideas page is NOT overwritten by `/sync-site` — managed separately.
