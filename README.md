# Onenote Notebook

An Obsidian plugin that adds a OneNote-style two-panel navigator next to the core file explorer.

- **Left panel:** notebooks (top-level vault folders) and their sections (subfolders).
- **Right panel:** the notes of the selected section. Select a note to open it.
- Create, rename, move and delete notebooks, sections and notes from the panel.
- Drag notes and sections between parents, and reorder them manually.

Loose files at the vault root are not shown in this view. Files directly inside a notebook (outside any section) appear under **(No section)**.

## Development

- Requires Node.js 18 or newer.
- `npm install` to install dependencies.
- `npm run dev` to build in watch mode.
- `npm run build` for a production build.
- `npm run lint` to run ESLint.

## Manual install

Copy `main.js`, `manifest.json` and `styles.css` to `<Vault>/.obsidian/plugins/onenote-notebook/`, reload Obsidian and enable the plugin in **Settings → Community plugins**.
