import { TFile, TFolder, Vault } from 'obsidian';
import { NO_SECTION } from '../types';

export function joinPath(parentPath: string, name: string): string {
	return parentPath === '/' ? name : `${parentPath}/${name}`;
}

export function getFolder(vault: Vault, path: string | null): TFolder | null {
	if (!path) return null;
	const file = vault.getAbstractFileByPath(path);
	return file instanceof TFolder ? file : null;
}

export function getNotebooks(vault: Vault): TFolder[] {
	return vault.getRoot().children.filter((c) => c instanceof TFolder);
}

export function getSections(notebook: TFolder): TFolder[] {
	return notebook.children.filter((c) => c instanceof TFolder);
}

export function getLooseFiles(notebook: TFolder): TFile[] {
	return notebook.children.filter((c) => c instanceof TFile);
}

export function getNotes(
	notebook: TFolder,
	section: TFolder | typeof NO_SECTION,
	recursive: boolean,
): TFile[] {
	if (section === NO_SECTION) return getLooseFiles(notebook);
	if (!recursive) return getLooseFiles(section);
	const notes: TFile[] = [];
	Vault.recurseChildren(section, (f) => {
		if (f instanceof TFile) notes.push(f);
	});
	return notes;
}

export function notesOrderKey(notebook: TFolder, sectionPath: string): string {
	return sectionPath === NO_SECTION
		? `${notebook.path}/${NO_SECTION}`
		: sectionPath;
}
