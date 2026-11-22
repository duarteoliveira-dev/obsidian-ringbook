import { Menu, TFile, TFolder } from 'obsidian';
import { NO_SECTION } from '../types';
import type { ExplorerHost } from '../types';
import { getNotebooks, getSections } from '../utils/vault-tree';

export function showNotebookMenu(host: ExplorerHost, notebook: TFolder, evt: MouseEvent): void {
	const menu = new Menu();
	menu.addItem((i) =>
		i.setTitle('New section').setIcon('folder-plus').onClick(() => host.actions.newSection(notebook)),
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
	const menu = new Menu();
	menu.addItem((i) =>
		i.setTitle('New note').setIcon('file-plus').onClick(() => host.actions.newNote(notebook, section.path)),
	);
	menu.addSeparator();
	menu.addItem((i) =>
		i.setTitle('Rename').setIcon('pencil').onClick(() => host.actions.rename(section)),
	);
	for (const target of getNotebooks(host.app.vault)) {
		if (target === section.parent) continue;
		menu.addItem((i) =>
			i
				.setTitle(`Move to notebook: ${target.name}`)
				.setIcon('folder-input')
				.onClick(() => void host.actions.moveInto(section, target)),
		);
	}
	menu.addItem((i) =>
		i.setTitle('Delete').setIcon('trash').onClick(() => host.actions.remove(section)),
	);
	menu.showAtMouseEvent(evt);
}

export function showNoSectionMenu(host: ExplorerHost, notebook: TFolder, evt: MouseEvent): void {
	const menu = new Menu();
	menu.addItem((i) =>
		i.setTitle('New note').setIcon('file-plus').onClick(() => host.actions.newNote(notebook, NO_SECTION)),
	);
	menu.showAtMouseEvent(evt);
}

export function showNoteMenu(host: ExplorerHost, note: TFile, evt: MouseEvent): void {
	const menu = new Menu();
	menu.addItem((i) =>
		i.setTitle('Rename').setIcon('pencil').onClick(() => host.actions.rename(note)),
	);
	menu.addSeparator();
	for (const notebook of getNotebooks(host.app.vault)) {
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
