import { Menu, TFile, TFolder } from 'obsidian';
import { NO_SECTION } from '../types';
import type { ExplorerHost } from '../types';
import { getFolder } from '../utils/vault-tree';

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
	const { app, actions } = host;
	const menu = new Menu();
	menu.addItem((i) =>
		i
			.setSection('open')
			.setTitle('Open in new tab')
			.setIcon('lucide-file-plus')
			.onClick(() => void app.workspace.getLeaf('tab').openFile(note)),
	);
	menu.addItem((i) =>
		i
			.setSection('open')
			.setTitle('Open to the right')
			.setIcon('lucide-separator-vertical')
			.onClick(() => void app.workspace.getLeaf('split', 'vertical').openFile(note)),
	);
	menu.addItem((i) =>
		i
			.setSection('open')
			.setTitle('Open in new window')
			.setIcon('lucide-picture-in-picture-2')
			.onClick(() => void app.workspace.getLeaf('window').openFile(note)),
	);
	menu.addItem((i) =>
		i
			.setSection('action')
			.setTitle('Make a copy')
			.setIcon('lucide-files')
			.onClick(() => void actions.copy(note)),
	);
	menu.addItem((i) =>
		i
			.setSection('danger')
			.setTitle('Rename...')
			.setIcon('lucide-edit-3')
			.onClick(() => actions.rename(note)),
	);
	menu.addItem((i) =>
		i
			.setSection('danger')
			.setTitle('Delete')
			.setIcon('lucide-trash-2')
			.setWarning(true)
			.onClick(() => void app.fileManager.promptForDeletion(note)),
	);
	app.workspace.trigger('file-menu', menu, note, 'file-explorer-context-menu');
	menu.showAtMouseEvent(evt);
}
