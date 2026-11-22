# Ringbook

Ringbook is an Obsidian plugin that lets you browse your vault like a ring binder. It adds a two-panel navigator next to the core file explorer: notebooks and sections on the left, the notes of the selected section on the right.

If you have used Microsoft OneNote, it will feel familiar: the navigation follows the same notebook → section → page model, and notebooks and sections get colored labels so you can tell them apart at a glance. Unlike OneNote, everything is plain folders and Markdown files in your vault.

Ringbook works directly on your vault's folders. It does not use a separate database or special file format, so everything you do in it is a normal folder or file operation that also shows in the core file explorer.

## How the vault maps to the view

| Ringbook concept | Vault equivalent |
| --- | --- |
| Notebook | A top-level folder of the vault |
| Section | A folder directly inside a notebook |
| Sub-folder | A folder directly inside a section (one extra level is shown) |
| Note | A file inside a section |

- Files loose at the vault root are not shown.
- Files directly inside a notebook (outside any section) are listed under **(No section)**.
- Non-Markdown files (images, PDFs and so on) appear in the note list with a small tag showing their extension.

## OneNote-style navigation and label colors

- **Notebook → section → note:** notebooks contain sections, and sections contain notes, just like notebooks, sections and pages in OneNote. The notes of the selected section are always visible next to the list of sections.
- **Colored labels:** each notebook icon and each section marker has its own color, like OneNote's section tabs. You choose the starting color for notebooks and for sections, and Ringbook generates distinct colors for the rest automatically. See **First notebook color**, **First section color** and **Color notebook icons** in the settings.
- **Manual ordering:** drag notebooks, sections and notes to arrange them the way you want.

## Features

### Opening the navigator

- Select the book icon in the ribbon, or
- Run the command **Open notebook explorer** from the command palette.

If the navigator is already open, it is brought into focus instead of opening a second copy.

### Left panel: notebooks and sections

- Select a notebook to expand it and show its sections. Select it again to collapse it.
- Select a section to show its notes in the right panel.
- Selecting a notebook automatically selects its first section (or **(No section)** if it only has loose files).
- Every notebook has a colored icon and every section a colored marker (see the color settings below).
- The **+** button in the panel header creates a new notebook. The **+** button on a notebook row creates a new section in it.
- Expanding and collapsing is animated. The animation is skipped if your system requests reduced motion.

### Right panel: notes

- Shows the notes of the selected section, with the name of the notebook and section as a header and a **+** button to create a note.
- Select a note to open it in the current tab. Hold **Ctrl** (**Cmd** on macOS) while selecting to open it in a new tab.
- The note that is currently open is highlighted.
- Hovering a row shows its full path.

### Creating, renaming, copying and deleting

All of these are available through the right-click menu of a row:

| Item | Menu actions |
| --- | --- |
| Notebook | New section, Rename, Delete |
| Section | New note, New folder (only on top-level sections), Rename, Make a copy, Delete, plus the entries other plugins add to the file menu |
| **(No section)** | New note |
| Note | Rename, Move to: *notebook / section* (one entry for each section in the vault), Delete |
| Empty space in the note list | New note, plus the entries other plugins add to the file menu |

Details:

- Names are validated: they cannot be empty, cannot contain `\ / : * ? " < > |` and cannot clash with an existing item (case-insensitive) in the same folder.
- **New note** from a section's menu creates an `Untitled` note (numbered if needed) and opens it. **New note** from the **+** button asks for a name first.
- Deleting a notebook, section or note asks for confirmation. Deleting a folder also deletes everything inside it. Deleted items go through Obsidian's normal trash setting.
- Renames use Obsidian's file manager, so links to renamed notes are updated according to your vault settings.

### Drag and drop

- **Reorder notebooks:** drag a notebook above or below another one.
- **Reorder sections:** drag a section above or below another section of the same parent. Dragging a section from another notebook moves it into the new parent and places it at the drop position. Sub-folders can only be reordered inside their own section.
- **Move a section into a notebook:** drop it on the middle of a notebook row.
- **Reorder notes:** drag a note above or below another note. If the note comes from a different section, it is moved there as well.
- **Move notes between sections:** drop a note on a section row, or on **(No section)**, to move it into that folder.
- A line or highlight shows where the item will land. If an item with the same name already exists at the destination, the move is cancelled and a notice explains why.

The manual order is stored in the plugin's data file (not in your notes). Items that have never been dragged follow the default order (see **Default note order** below). New and renamed items keep their position.

### Resizable panels

Drag the divider between the two panels to resize them. The width is remembered between sessions. The default is 45% of the view.

### Remembered state

Ringbook remembers the last selected notebook and section, and restores them when the view opens again. Renaming or moving the selected folder keeps the selection on it.

### Live updates

The view refreshes when files are created, deleted, renamed or (with **Last modified** ordering) edited, so it stays in sync with changes made from the core file explorer, other plugins or sync tools.

## Settings

Open **Settings → Community plugins → Ringbook**.

### Hide ribbon panel

Toggles Obsidian's own left ribbon bar. It is a shortcut for the built-in **Show ribbon** option under **Settings → Appearance** (the setting is inverted: turning this on hides the ribbon). Useful if you only open Ringbook from the command palette and want more room. Default: off.

### Include nested folders

Controls which notes a section lists.

- **On:** notes from every folder nested inside the section are listed too, in one flat list.
- **Off:** only the files directly inside the section are listed.

Default: on.

### First notebook color

The color of the first notebook's icon. Every other notebook gets an automatic color derived from this one by rotating its hue by the golden angle, so neighbours always look different no matter how many notebooks you have. If you choose white, grey or black (which have no hue), the following notebooks use a fixed vivid saturation and lightness instead. Default: white.

Has no visible effect when **Color notebook icons** is off.

### First section color

The color of the marker on the first section of each notebook. The other sections of the same notebook get colors derived from it in the same way as for notebooks. Default: white.

### Auto reveal note

When on, opening a note (from anywhere: a link, quick switcher, another file explorer) selects its notebook and section in Ringbook and expands the notebook, so the panel always shows where the open note lives. Turning it on also reveals the current note immediately. Default: off.

### Auto close notebooks

When on, expanding a notebook collapses all the others, so only one notebook is open at a time. Default: off.

### Color notebook icons

- **On:** each notebook icon has its own color, derived from **First notebook color**.
- **Off:** all notebook icons use your theme's accent color.

Default: on.

### Notebook panel font size

Font size, in pixels, of notebook and section names in the left panel. Range 8–24 px. Default: 13.

### Note title font size

Font size, in pixels, of note titles in the right panel. Range 8–24 px. Default: 13.

### Default note order

How notes are sorted when they have not been reordered by dragging.

- **Name:** alphabetical.
- **Last modified:** most recently edited first. The list refreshes when you edit a note.

Notes you have dragged keep their manual position either way. Default: Name.

## Data and privacy

Ringbook works fully offline and makes no network requests. It stores its settings, manual ordering, last selection and panel width in `<Vault>/.obsidian/plugins/ringbook/data.json`. It only reads and changes files inside your vault, and only when you ask it to (create, rename, copy, move or delete).

## Development

- Requires Node.js 18 or newer.
- `npm install` to install dependencies.
- `npm run dev` to build in watch mode.
- `npm run build` for a production build.
- `npm run lint` to run ESLint.

### Manual install

Copy `main.js`, `manifest.json` and `styles.css` to `<Vault>/.obsidian/plugins/ringbook/`, reload Obsidian and enable the plugin in **Settings → Community plugins**.
