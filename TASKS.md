# TAT Microsite — Task List

Tweaks and outstanding work for the Thou Art That microsite.

---

## Open

- [ ] **Audio: choose background bed + splice with narrations** — 13 dry voice MP3s live in `content-src/audio/mp3/`. Need: (1) generate ElevenLabs music bed per `_music-prompt.md` spec, (2) source canonical Marbl 9s stinger, (3) ffmpeg mix per track (stinger → voice -16 LUFS over bed -24 LUFS, 1.5s bed fade-in, 2s tail fade-out), (4) replace files in `content-src/audio/mp3/`.
- [ ] **GH repo widget — stale stats** — canonical `github-repo` component on tat.marbl.codes not displaying correct star count (likely forks/watchers too). Investigate data source / cache / API call in `marbl-codes` library.
- [ ] **Redirect `marbl.codes/thou-art-that` → `tat.marbl.codes`** — old subpath route still exists on the parent site. Add 301 redirect at the marbl.codes root-level `.htaccess` so any inbound links / index entries resolve to the canonical subdomain.
- [ ] **Add accent text to top-level pages + section landings** — `tat.marbl.codes` top-level pages (landing, `/study/`) and category landings (`/study/principles/`, `/study/hr/`, `/study/technical/`, `/study/curious/`, `/study/legal/`) need accent text / subhead copy to give them more presence and visual weight.
- [ ] **About page — rename "The name" section title to "Tat Tvam Asi"** — Sanskrit phrase that "Thou Art That" translates from. (Note: Richard wrote "Tvasm" — assuming intended "Tvam" as the canonical transliteration; confirm before commit.)

## Done

_(none yet — log completions here as we close them)_
