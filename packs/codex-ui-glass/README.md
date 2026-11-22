# codex-ui glass compat

Copy this folder into an extension root and enable it:

- profile: `<profile>/.sandbox/extensions/codex-ui-glass/`
- shared: `~/.dsh/tool-hub/extensions/codex-ui-glass/`

The manifest declares `styles: ["style.css"]`. The host reads the CSS and the panel injects it
while the extension is loaded.

## What 1.2.0 does

- Uses the official DSH wordmark as a large, low-contrast background mark. The SVG is gradient-filled
  and carries a brand-blue glow; dark mode keeps the gradient instead of inverting it to grey.
- Makes the topbar an independent floating capsule: 12px gaps, 18px corners, backdrop blur, shadow
  and the `--dsh-glass-card-raised` material. Clear / standard / frosted therefore change its
  transparency.
- Lets the content scroll underneath the capsule, so rows remain visible through the glass.
- Paints the tool-hub root with its own light glass gradient and dot texture, then styles cards,
  dialogs, the side rail and the dock button with the same three material levels.
- Stays inert when disabled: the client's `th-brand-mark` node is hidden by the base client CSS and
  the panel keeps its normal layout.

## DOM contract

The style follows codex-ui's DOM contract, not its source: when codex-ui enables glass it sets

- `<html data-dsh-glass>`
- `data-dsh-glass-float` (mica layout) or `data-dsh-glass-compat` (flat glass)
- `--dsh-glass-blur`, `--dsh-glass-frost`, `--dsh-glass-glow`

on the document. The CSS is scoped to `.th-root`, `.th-dock-btn` and `.th-sidebar-entry`, so it
only touches this plugin's surfaces.

Source mark: `packs/codex-ui-glass/dsh-wordmark.svg` (official DSH wordmark from the app's
`renderer/assets/welcome-brand.svg`).
