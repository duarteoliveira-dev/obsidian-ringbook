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

export function getOpenNotebooks(vault: Vault, hidden: string[]): TFolder[] {
	return getNotebooks(vault).filter((n) => !hidden.includes(n.path));
}

export function getClosedNotebooks(vault: Vault, hidden: string[]): TFolder[] {
	return getNotebooks(vault)
		.filter((n) => hidden.includes(n.path))
		.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export function getSections(notebook: TFolder): TFolder[] {
	return notebook.children.filter((c) => c instanceof TFolder);
}

export function subsectionsOrderKey(section: TFolder): string {
	return `${section.path}/__subsections__`;
}

export function getLooseFiles(notebook: TFolder): TFile[] {
	return notebook.children.filter((c) => c instanceof TFile);
}

export function getNotes(
	notebook: TFolder,
	section: TFolder | typeof NO_SECTION,
): TFile[] {
	return getLooseFiles(section === NO_SECTION ? notebook : section);
}

export function notesOrderKey(notebook: TFolder, sectionPath: string): string {
	return sectionPath === NO_SECTION
		? `${notebook.path}/${NO_SECTION}`
		: sectionPath;
}
