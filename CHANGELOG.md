# Changelog

All notable changes to Ringbook are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.1] - 2026-11-28

Requires Obsidian 1.13.0 or later.

### Changed

- Republished 1.1.0 as 1.1.1. There are no functional changes.

## [1.1.0] - 2026-11-28

Requires Obsidian 1.13.0 or later.

### Added

- Selecting a section or folder opens a note from it in the current tab: the last note you opened there, or the first note of the list. Nothing opens if the folder has no notes.
- Compact **Add note** button at the top of the note list.
- A line separates the notebooks in the notebooks panel.

### Changed

- The note list shows only the notes directly inside the selected folder, not the notes of its subfolders.
- The note list has more space between the note names and the left edge.
- The note list header no longer shows the section name.

### Removed

- The **Include nested folders** setting, since the note list never includes subfolders now.

## [1.0.1] - 2026-11-24

Requires Obsidian 1.13.0 or later.

### Added

- Search box at the top of the notebooks panel that filters notebooks, sections and folders by name, with the matching text highlighted.
- Toolbar with four buttons: **New ringbook**, **New section or folder**, **Collapse all** and **Focus**. It replaces the "Notebooks" title and the **+** button.
- Focus: show only one notebook, section or folder in the notebooks panel. Use the context menu, the toolbar or the **Toggle focus on selected item** command. Focus is not saved between sessions.
- Close notebooks from the context menu, with a **Closed notebooks** row to reopen them and a **Reopen closed notebook** command.
- **Note list position** setting: show the note list to the right of the notebooks panel or below it. Each layout remembers its own panel size.
- Sections that contain folders show an arrow and can be collapsed and expanded, with the same animation as notebooks.
- Settings are grouped under **Layout**, **Colors**, **Notes** and **Navigation**, and appear in Obsidian's settings search.
- This changelog and a **Compatibility** section in the README.

### Changed

- Minimum Obsidian version is now 1.13.0 (was 1.8.7).
- The notebook icon is now a ring binder icon.
- The plugin description mentions OneNote-style navigation and color-coded section tabs.
- **First notebook color** is greyed out when **Color notebook icons** is off.
- The README was rewritten to document all features and settings.

### Fixed

- The notebook close animation did not play right after a notebook had been opened.
- Removed deprecated Obsidian API calls (slider tooltip, destructive button style).

### Notes

- The Iconize plugin is not supported because it is deprecated.

## [1.0.0] - 2026-11-22

First release.

- Two-panel navigator: notebooks (top-level folders) and sections (subfolders) on the left, the notes of the selected section on the right.
- Color-coded notebook icons and section markers.
- Create, rename, copy, move and delete notebooks, sections and notes from context menus.
- Drag and drop to reorder and move items, and a resizable divider.
- Settings: include nested folders, first notebook and section colors, auto reveal note, auto close notebooks, notebook icon colors, font sizes, default note order and a ribbon shortcut.

[1.0.1]: https://github.com/duarteoliveira-dev/obsidian-ringbook/releases/tag/1.0.1
[1.0.0]: https://github.com/duarteoliveira-dev/obsidian-ringbook/releases/tag/1.0.0
