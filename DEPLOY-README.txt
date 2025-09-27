# PegSetting — Deploy‑Ready PWA

## What’s included
- Correct SW scope (relative registration) for GitHub Pages or subpaths
- `data.json` fetched with `cache: "no-store"` and cache‑busting param
- Event broadcasting so Min/Max & Range update immediately when `data.json` changes
- Service worker bypass for `data.json` (network fetch with `no-store`)
- Hardened admin overlay (safe‑guards, Min/Max editable, upload/download JSON)

## Deploy (GitHub Pages or any static host)
1. Upload **all files** from this folder to your hosting path (overwrite existing).
2. If using GitHub Pages, also copy `index.html` to `404.html` once (optional but recommended).
3. After you publish a **new `data.json`**, open tabs will auto‑update within ~1 minute.
   No hard refresh required.

## One‑time cleanup on stubborn devices
DevTools → Application → Clear storage → Clear site data, then reload.
Make sure “Update on reload” is **unchecked** in Application → Service Workers.
