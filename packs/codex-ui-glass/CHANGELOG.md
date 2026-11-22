# codex-ui-glass

## 1.1.0

- Dialogs and fields now consume codex-ui's own `--dsh-glass-card` / `--dsh-glass-card-raised`
  tokens, so Clear / Standard / Frosted match its 8/25/45 frost levels exactly.


## 1.0.9

- Dialog, field and scrim opacity now derive from the selected material preset
  (`--dsh-glass-frost`), so Clear / Standard / Frosted change the panel too.


## 1.0.8

- Lighter dialog scrim so the glass no longer reads as flat grey.


## 1.0.7

- High-transparency dialogs and fields.


## 1.0.6

- Dialogs are a little more transparent while staying readable.
- Add a faint DSH dot grid and wordmark as the panel ground.


## 1.0.5

- Follow both layout modes: compat returns to the official flush layout, float uses rounded panels.
- Follow codex's floor-glow switch with two soft brand spots (no opaque background).


## 1.0.4

- Align the left rail and main column as two equal-height rounded glass panels.


## 1.0.3

- Dialogs use a light scrim and a readable glass surface instead of a full-page grey blur.


## 1.0.2

- Make the host plugin wrapper transparent when the tool hub is inside it, so the DSH
  background shows through instead of a white plugin sheet.


## 1.0.1

- Let the DSH wallpaper show through instead of painting a panel gradient.
- Do not paint the sidebar entry chip (the host icon keeps its own color).


## 1.0.0

- Follows codex-ui's `data-dsh-glass` / `data-dsh-glass-float` / `data-dsh-glass-compat` DOM
  contract and its `--dsh-glass-*` material tokens.
- Styles the panel cards, group headers, rows, dialogs, inputs, dock button and sidebar entry.
- No ops, no settings, no host state: installation is a folder copy plus the extension toggle.
