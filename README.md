
# QFM Peg Settings — Dilution Calculator (Production)

This is the production-ready build. Highlights:
- Full dataset in **data.json**
- Auto-refresh on deploy (service worker broadcasts reload)
- Network-first for **index.html** and **data.json** (no stale content)
- Install banner (Chrome/Edge) + iOS & macOS Safari tips
- Diagnostics banner for fetch/JSON errors
- Edge-specific install text

## Deploy (GitHub Pages)
1. Create a **public** repo.
2. Upload all files from this folder (keep structure).
3. Settings → **Pages** → Deploy from **main / (root)**.
4. Wait for the green check → open your Page URL.

## Update data
- Edit **data.json** in GitHub and commit.
- The app fetches `data.json?v=timestamp` so updates appear immediately.

## Force refresh (rare)
- Chrome/Edge: DevTools → Application → Service Workers → Update/Unregister once → refresh.
- Safari: close and reopen the tab/PWA.
