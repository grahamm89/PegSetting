
# Dilution Calculator (PWA) — Full Package

## Deploy (GitHub Pages)
1. Create a repo (public). Settings → Pages → Deploy from branch: `main`, folder: `/ (root)`.
2. Upload the **contents** of this ZIP to the repo root.
3. Wait 30–90s, then open the Pages URL.

## Update data
- Press **E** twice on the main page → password `apex-admin` → editor opens.
- Add/edit/delete rows → **Download JSON** → upload to GitHub as `data.json` and commit.
- Or visit `/admin.html`, login (`apex-admin`), and use the same editor.

## Cache-busting
- Service worker version changes per build; `data.json` is fetched with a timestamp param to avoid stale cache.
- If you ever see an old version once: DevTools → Application → Service Workers → Unregister → refresh. After this, updates are automatic.
