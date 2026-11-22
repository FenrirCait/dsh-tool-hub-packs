# codex-ui-glass

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
