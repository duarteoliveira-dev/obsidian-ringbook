import { Menu, TFile, TFolder } from 'obsidian';
import { NO_SECTION } from '../types';
import type { ExplorerHost } from '../types';
import { getFolder, getOpenNotebooks, getSections } from '../utils/vault-tree';

function addFocusItem(menu: Menu, host: ExplorerHost, folder: TFolder): void {
	const focused = host.pluginData.focusPath === folder.path;
	menu.addItem((i) =>
		i
			.setTitle(focused ? 'Exit focus' : 'Focus')
			.setIcon('focus')
			.onClick(() => (focused ? host.clearFocus() : host.setFocus(folder))),
	);
}

export function showNotebookMenu(host: ExplorerHost, notebook: TFolder, evt: MouseEvent): void {
	const menu = new Menu();
	menu.addItem((i) =>
		i.setTitle('New section').setIcon('folder-plus').onClick(() => host.actions.newSection(notebook)),
	);
	addFocusItem(menu, host, notebook);
	menu.addItem((i) =>
		i.setTitle('Close notebook').setIcon('eye-off').onClick(() => host.closeNotebook(notebook)),
	);
	menu.addSeparator();
	menu.addItem((i) =>
		i.setTitle('Rename').setIcon('pencil').onClick(() => host.actions.rename(notebook)),
	);
	menu.addItem((i) =>
		i.setTitle('Delete').setIcon('trash').onClick(() => host.actions.remove(notebook)),
	);
	menu.showAtMouseEvent(evt);
}

export function showSectionMenu(
	host: ExplorerHost,
	notebook: TFolder,
	section: TFolder,
	evt: MouseEvent,
): void {
	const { actions, app } = host;
	const menu = new Menu();
	menu.addItem((i) =>
		i
			.setSection('action-primary')
			.setTitle('New note')
			.setIcon('lucide-edit')
			.onClick(() => void actions.newUntitledNote(notebook, section)),
	);
	if (section.parent === notebook) {
		menu.addItem((i) =>
			i
				.setSection('action-primary')
				.setTitle('New folder')
				.setIcon('lucide-folder')
				.onClick(() => actions.newSection(notebook, section)),
		);
	}
	menu.addItem((i) =>
		i
			.setSection('action-primary')
			.setTitle(host.pluginData.focusPath === section.path ? 'Exit focus' : 'Focus')
			.setIcon('focus')
			.onClick(() =>
				host.pluginData.focusPath === section.path
					? host.clearFocus()
					: host.setFocus(section),
			),
	);
	menu.addItem((i) =>
		i
			.setSection('danger')
			.setTitle('Rename...')
			.setIcon('lucide-edit-3')
			.onClick(() => actions.rename(section)),
	);
	menu.addItem((i) =>
		i
			.setSection('action')
			.setTitle('Make a copy')
			.setIcon('lucide-files')
			.onClick(() => void actions.copy(section)),
	);
	menu.addItem((i) =>
		i
			.setSection('danger')
			.setTitle('Delete')
			.setIcon('lucide-trash-2')
			.setWarning(true)
			.onClick(() => void app.fileManager.promptForDeletion(section)),
	);
	app.workspace.trigger('file-menu', menu, section, 'file-explorer-context-menu');
	menu.showAtMouseEvent(evt);
}

export function showNoSectionMenu(host: ExplorerHost, notebook: TFolder, evt: MouseEvent): void {
	const menu = new Menu();
	menu.addItem((i) =>
		i.setTitle('New note').setIcon('file-plus').onClick(() => host.actions.newNote(notebook, NO_SECTION)),
	);
	menu.showAtMouseEvent(evt);
}

export function showNotesAreaMenu(
	host: ExplorerHost,
	notebook: TFolder,
	sectionPath: string,
	evt: MouseEvent,
): void {
	const menu = new Menu();
	menu.addItem((i) =>
		i
			.setSection('action-primary')
			.setTitle('New note')
			.setIcon('lucide-edit')
			.onClick(() => host.actions.newNote(notebook, sectionPath)),
	);
	const folder = sectionPath === NO_SECTION ? notebook : getFolder(host.app.vault, sectionPath);
	if (folder) host.app.workspace.trigger('file-menu', menu, folder, 'file-explorer-context-menu');
	menu.showAtMouseEvent(evt);
}

export function showNoteMenu(host: ExplorerHost, note: TFile, evt: MouseEvent): void {
	const menu = new Menu();
	menu.addItem((i) =>
		i.setTitle('Rename').setIcon('pencil').onClick(() => host.actions.rename(note)),
	);
	menu.addSeparator();
	for (const notebook of getOpenNotebooks(host.app.vault, host.pluginData.hiddenNotebooks)) {
		for (const section of getSections(notebook)) {
			if (section === note.parent) continue;
			menu.addItem((i) =>
				i
					.setTitle(`Move to: ${notebook.name} / ${section.name}`)
					.setIcon('folder-input')
					.onClick(() => void host.actions.moveInto(note, section)),
			);
		}
	}
	menu.addSeparator();
	menu.addItem((i) =>
		i.setTitle('Delete').setIcon('trash').onClick(() => host.actions.remove(note)),
	);
	menu.showAtMouseEvent(evt);
}
