# dsh-tool-hub official compat packs

Compatibility packs for **dsh-tool-hub**, distributed independently from the plugin package.

- `packs/<id>/` — one normal dsh-tool-hub extension per folder (manifest, host entry, styles).
- `index.json` — generated catalog: pack id, version, description, per-file URLs and SHA-256.
- `scripts/build-index.mjs` — regenerate the catalog after editing a pack.

The plugin's **Official packs** manager reads the catalog, lets the owner install/update one pack,
and verifies every file hash before writing anything. Nothing here is auto-installed.

## Publish

1. Create/choose the repository, e.g. `FenrirCait/dsh-tool-hub-packs`.
2. Run `node scripts/build-index.mjs <owner/repo> <branch>`.
3. Commit and push. Tag releases if you want history; the catalog points at raw files on the branch.

Default index: `https://raw.githubusercontent.com/FenrirCait/dsh-tool-hub-packs/main/index.json`
Mirror fallback: `https://cdn.jsdelivr.net/gh/FenrirCait/dsh-tool-hub-packs@main/index.json`