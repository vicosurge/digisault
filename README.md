# digisault
Repository for Table-Top RPG related things

## Hosting

The repo is a static site on Cloudflare Pages. There's no build step; the output directory is the repo root.

The Call of Cthulhu character sheet (`/coc/players/`) saves characters through Pages Functions in
`functions/coc/players/api/`:

| Endpoint | Method | What it does |
|---|---|---|
| `/coc/players/api/save` | POST | Save the sheet (JSON body with a `name`) |
| `/coc/players/api/list` | GET | Saved character filenames, newest first |
| `/coc/players/api/load/<name>` | GET | Load one character |
| `/coc/players/api/delete/<name>` | DELETE | Delete one character |
| `/coc/players/api/backup` | GET | Download every character as one JSON file |

Pages project settings:

- **KV namespace binding:** `SHEETS` (required). Production and Preview are configured separately. Give
  Preview its own namespace, so testing a branch never touches the real sheets.
- **Variable `SHEETS_PASSCODE`:** optional but recommended. Set it as an encrypted secret, and the page
  will ask players for it once.

`404.html` is served for unknown paths (without it, Pages would answer every URL with the home page), and
`_headers` adds basic security headers to the static files.

Run it locally with the same bindings:

```
npx wrangler pages dev . --kv SHEETS --binding SHEETS_PASSCODE=changeme
```
