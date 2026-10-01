# TAT restyle to the new Marbl Codes look - 1 October 2026

Local `dist/` served under the real URL (Playwright route), guest context, before deploy.

- `asset-check.txt` - home + About at 390 and 1440: no failed requests, no broken images; `failed=[...]` carries only the page width and the H1 font readings (Geist everywhere). docW 380 / 1430 = viewport minus the 10px scrollbar gutter, so no sideways scroll.
- `behaviour-check.txt` - /study/curious/reflection-prompts/ at 1440 (nav opens on hover) and 390 (opens on tap): links visible, logo stinger built, zero console errors, phone page exactly 390 wide (the 1 Oct About overflow is gone).
- Screenshots: landing, About, a deep page, the open menu and the footer at both widths.
- Edges measured: logo, sidebar, hero and footer start at x=55; nav pill, contents card and socials end at 1375 (1440 viewport).

Not run: Lighthouse (to run on the live URL after deploy). CSP checked by reading `_headers`: every new asset is same-origin (`'self'` on script/style/font/img).
