import { Keymap, setIcon, TFile } from 'obsidian';
import { NO_SECTION } from '../types';
import type { ExplorerHost } from '../types';
import { sortItems } from '../utils/order-store';
import { getFolder, getNotes, notesOrderKey } from '../utils/vault-tree';
import { showNoteMenu } from './context-menu';
import { attachDropTarget, makeDraggable } from './drag-drop';

export class NoteListRenderer {
	constructor(
		private el: HTMLElement,
		private host: ExplorerHost,
	) {}

	render(): void {
		const { app, pluginData, selection, actions } = this.host;
		this.el.empty();

		const notebook = getFolder(app.vault, selection.notebookPath);
		const sectionPath = selection.sectionPath;
		const sectionFolder =
			sectionPath && sectionPath !== NO_SECTION ? getFolder(app.vault, sectionPath) : null;
		const valid = notebook && sectionPath && (sectionPath === NO_SECTION || sectionFolder);

		const header = this.el.createDiv({ cls: 'onb-col-header' });
		const title = !valid
			? 'Notes'
			: sectionPath === NO_SECTION
				? '(No section)'
				: (sectionFolder?.name ?? 'Notes');
		header.createSpan({ cls: 'onb-col-title', text: title });

		const list = this.el.createDiv({ cls: 'onb-list' });
		if (!valid) {
			list.createDiv({ cls: 'onb-empty', text: 'Select a section to see its notes.' });
			return;
		}

		const add = header.createSpan({
			cls: 'clickable-icon',
			attr: { 'aria-label': 'New note' },
		});
		setIcon(add, 'plus');
		add.addEventListener('click', () => actions.newNote(notebook, sectionPath));

		const { settings, order } = pluginData;
		const key = notesOrderKey(notebook, sectionPath);
		const notes = sortItems(
			getNotes(notebook, sectionFolder ?? NO_SECTION, settings.showNotesRecursively),
			key,
			order,
			settings.noteSortOrder,
		);
		if (notes.length === 0) {
			list.createDiv({ cls: 'onb-empty', text: 'No notes in this section.' });
		}

		const dropFolder = sectionFolder ?? notebook;
		const activePath = app.workspace.getActiveFile()?.path;
		for (const note of notes) {
			const row = list.createDiv({
				cls: 'onb-row onb-note',
				attr: { title: note.path },
			});
			row.toggleClass('is-selected', note.path === activePath);
			row.createSpan({
				cls: 'onb-row-title',
				text: note.extension === 'md' ? note.basename : note.name,
			});

			row.addEventListener('click', (evt) => {
				void app.workspace.getLeaf(Keymap.isModEvent(evt)).openFile(note);
			});
			row.addEventListener('contextmenu', (evt) => {
				evt.preventDefault();
				showNoteMenu(this.host, note, evt);
			});
			makeDraggable(row, { type: 'note', path: note.path });
			attachDropTarget(row, {
				mode: (p) => (p.type === 'note' && p.path !== note.path ? 'reorder' : null),
				onDrop: async (payload, zone) => {
					const moved = app.vault.getAbstractFileByPath(payload.path);
					if (!(moved instanceof TFile) || (zone !== 'before' && zone !== 'after')) return;
					await actions.reorder({
						moved,
						target: note,
						zone,
						siblings: notes,
						key,
						moveTo: notes.includes(moved) ? null : dropFolder,
					});
				},
			});
		}
	}
}
