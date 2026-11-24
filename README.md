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

### Commands

| Command | What it does |
| --- | --- |
| **Open notebook explorer** | Opens the navigator, or brings it into focus if it is already open. |
| **Reopen closed notebook** | Lists the closed notebooks and reopens the one you pick. See *Closing and reopening notebooks*. |
| **Toggle focus on selected item** | Focuses the selected section (or notebook), or exits focus. See *Focus*. |

### Left panel: notebooks and sections

- Select a notebook to expand it and show its sections. Select it again to collapse it.
- Select a section to show its notes in the right panel.
- Selecting a notebook automatically selects its first section (or **(No section)** if it only has loose files).
- A section that contains folders shows an arrow instead of its color marker. Select the section (or the arrow) to show its notes and collapse or expand its folders.
- Every notebook has a colored icon and every section a colored marker (see the color settings below).
- A toolbar at the top of the panel has four buttons:
    - **New ringbook** creates a new notebook.
    - **New section or folder** creates a section in the selected notebook. When a section is selected it offers **New section** or **New folder in *section***.
    - **Collapse all** collapses every notebook and every section's folders.
    - **Focus on selected item** turns focus on or off (highlighted while focus is on). See *Focus*.
- The **+** button on a notebook row also creates a new section in it.
- Right-click a notebook, section or folder for its menu, including **Close notebook** and **Focus** (see below).
- Expanding and collapsing is animated. The animation is skipped if your system requests reduced motion.

### Search

A search box at the top of the notebooks panel filters the tree by name as you type. It matches notebooks, sections and sub-folders (not notes).

- Matching is case-insensitive and finds the text anywhere in the name. The matching part is highlighted.
- A match is shown together with the notebook and section it belongs to, and everything else is hidden. For example, searching `cardi` shows the notebook *Healthcare* and its section *Cardiology*.
- If a notebook or section name matches, all of its content stays visible.
- While searching, notebooks and sections stay expanded. Selecting one shows its notes without collapsing it.
- Clear the search with the **×** button in the box or by pressing **Esc**.
- The search is temporary: it is not saved, and it is hidden while **Focus** is active. Closed notebooks are not searched.

### Closing and reopening notebooks

- Right-click a notebook and choose **Close notebook** to remove it from the list. Nothing changes in your vault: the folder and its notes stay where they are and remain visible in the core file explorer. Ringbook only remembers not to show it.
- When at least one notebook is closed, a **Closed notebooks (N)** row appears at the bottom of the notebooks panel. Select it to see the closed notebooks and pick one to reopen. It comes back at its previous position.
- You can also run the command **Reopen closed notebook** from the command palette and search for the notebook by name.
- Closed notebooks keep following renames. If you delete the folder, it is removed from the closed list.
- Opening a note that lives in a closed notebook does not reopen it, even with **Auto reveal note** on.

### Focus

Focus hides the rest of the tree in the notebooks panel so you only see one item.

- Right-click a notebook, section or sub-folder and choose **Focus**. The panel then shows only that item (a focused notebook shows all its sections, a focused section shows its folders, a focused folder shows just itself).
- To leave focus, select the highlighted focus button in the toolbar, choose **Exit focus** from the item's menu, or run the command.
- The command **Toggle focus on selected item** focuses the section that is currently selected (or its notebook if no section is selected), and exits focus if one is active.
- Focusing an item selects it, so its notes appear in the note list.
- While focus is on, opening a note outside the focused item does not change the selection, even with **Auto reveal note** on.
- Focus is not saved: it resets when you restart Obsidian. It follows renames. It ends if the focused folder is deleted or its notebook is closed.

### Right panel: notes

- Shows the notes of the selected section, with the name of the notebook and section as a header and a **+** button to create a note.
- Select a note to open it in the current tab. Hold **Ctrl** (**Cmd** on macOS) while selecting to open it in a new tab.
- The note that is currently open is highlighted.
- Hovering a row shows its full path.

### Creating, renaming, copying and deleting

All of these are available through the right-click menu of a row:

| Item | Menu actions |
| --- | --- |
| Notebook | New section, Focus, Close notebook, Rename, Delete |
| Section | New note, New folder (only on top-level sections), Focus, Rename, Make a copy, Delete, plus the entries other plugins add to the file menu |
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

### Layout and resizable panels

The note list can sit to the right of the notebooks panel (vertical split) or below it (horizontal split). Change it with **Note list position** in the settings.

Drag the divider between the two panels to resize them. The size is remembered between sessions (a width for the side-by-side layout, a height for the stacked one). The default is 45% of the view width, or 50% of its height when stacked.

### Remembered state

Ringbook remembers the last selected notebook and section, the closed notebooks and the panel size, and restores them when the view opens again. Renaming or moving the selected folder keeps the selection on it. Focus is the exception: it is not saved.

### Live updates

The view refreshes when files are created, deleted, renamed or (with **Last modified** ordering) edited, so it stays in sync with changes made from the core file explorer, other plugins or sync tools.

## Settings

Open **Settings → Community plugins → Ringbook**.

The options are grouped under four headings in the settings tab: **Layout**, **Colors**, **Notes** and **Navigation**.

### Layout

#### Note list position

Where the note list is shown.

- **Right of notebooks:** the two panels sit side by side (vertical split).
- **Below notebooks:** the note list is placed under the notebooks panel (horizontal split), which suits narrow side panes.

The divider can be dragged in both layouts, and Ringbook remembers a separate size for each one. Default: right of notebooks.

#### Notebook panel font size

Font size, in pixels, of notebook and section names in the left panel. Range 8–24 px. Default: 13.

#### Note title font size

Font size, in pixels, of note titles in the right panel. Range 8–24 px. Default: 13.

#### Hide ribbon panel

Toggles Obsidian's own left ribbon bar. It is a shortcut for the built-in **Show ribbon** option under **Settings → Appearance** (the setting is inverted: turning this on hides the ribbon). Useful if you only open Ringbook from the command palette and want more room. Default: off.

### Colors

#### Color notebook icons

- **On:** each notebook icon has its own color, derived from **First notebook color**.
- **Off:** all notebook icons use your theme's accent color.

Default: on.

#### First notebook color

The color of the first notebook's icon. Every other notebook gets an automatic color derived from this one by rotating its hue by the golden angle, so neighbours always look different no matter how many notebooks you have. If you choose white, grey or black (which have no hue), the following notebooks use a fixed vivid saturation and lightness instead. Default: white.

This option is greyed out when **Color notebook icons** is off.

#### First section color

The color of the marker on the first section of each notebook. The other sections of the same notebook get colors derived from it in the same way as for notebooks. Default: white.

### Notes

#### Include nested folders

Controls which notes a section lists.

- **On:** notes from every folder nested inside the section are listed too, in one flat list.
- **Off:** only the files directly inside the section are listed.

Default: on.

#### Default note order

How notes are sorted when they have not been reordered by dragging.

- **Name:** alphabetical.
- **Last modified:** most recently edited first. The list refreshes when you edit a note.

Notes you have dragged keep their manual position either way. Default: Name.

### Navigation

#### Auto reveal note

When on, opening a note (from anywhere: a link, quick switcher, another file explorer) selects its notebook and section in Ringbook and expands the notebook, so the panel always shows where the open note lives. Turning it on also reveals the current note immediately. Default: off.

#### Auto close notebooks

When on, expanding a notebook collapses all the others, so only one notebook is open at a time. Default: off.

## Compatibility

Ringbook does not support the [Iconize](https://github.com/FlorianWoelki/obsidian-iconize) plugin. Iconize is deprecated and no longer maintained by its author, so icons you set with it are not shown in Ringbook, which always uses its own notebook icon and section markers.

## Data and privacy

Ringbook works fully offline and makes no network requests. It stores its settings, manual ordering, last selection, closed notebooks and panel sizes in `<Vault>/.obsidian/plugins/ringbook/data.json`. It only reads and changes files inside your vault, and only when you ask it to (create, rename, copy, move or delete).

## Development

- Requires Node.js 18 or newer.
- `npm install` to install dependencies.
- `npm run dev` to build in watch mode.
- `npm run build` for a production build.
- `npm run lint` to run ESLint.

### Manual install

Copy `main.js`, `manifest.json` and `styles.css` to `<Vault>/.obsidian/plugins/ringbook/`, reload Obsidian and enable the plugin in **Settings → Community plugins**.
