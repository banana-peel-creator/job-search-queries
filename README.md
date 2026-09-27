# Job Search Queries

A static page that builds Google searches against job-board platforms (Lever, Greenhouse, Ashby and others). It's plain HTML, CSS and JS, with no build step, backend or tracking. Everything the site serves is in `public/`.

## Run locally

```
npx serve public
```

You can also open `public/index.html` directly in a browser.

## Deploy to Cloudflare Pages

### Option A: Git-connected

1. Push this folder to a GitHub or GitLab repo.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `public`
4. Click **Save and Deploy**. Each push to the main branch redeploys the site.

### Option B: Direct upload with Wrangler

```
npx wrangler login
npx wrangler pages project create job-search-queries --production-branch main
npx wrangler pages deploy
```

`wrangler.toml` sets `pages_build_output_dir = "public"`, so `pages deploy` needs no path argument.

## Notes

- **Time filters:** these use `tbs=qdr:<unit><n>`, for example `qdr:h6`, `qdr:d3` or `qdr:w2`, plus `sbd:1` to sort by date. Google only documents `h/d/w/m/y`. The numbered form is widely reported to work, but Google doesn't guarantee it. The spec's colon form (`qdr:h:6`) isn't a known format and isn't used.
- **Search All:** Google ignores query words after the 32nd. The combined query is split into as many "Search All (n/N)" buttons as needed to stay under that limit.
