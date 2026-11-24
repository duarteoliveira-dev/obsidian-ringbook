import type { App, TFile, TFolder } from 'obsidian';
import type { FileActions } from './utils/file-actions';
import type { RingbookSettings } from './settings';

export type Notebook = TFolder;
export type Section = TFolder;
export type Note = TFile;

export const NO_SECTION = '__no_section__';
export type SectionRef = Section | typeof NO_SECTION;

export interface PluginData {
	settings: RingbookSettings;
	order: Record<string, string[]>;
	lastNotebookPath: string | null;
	lastSectionPath: string | null;
	treeWidth: number | null;
	treeHeight: number | null;
	hiddenNotebooks: string[];
	focusPath: string | null;
}

export interface Selection {
	notebookPath: string | null;
	sectionPath: string | null;
}

export interface DragPayload {
	type: 'notebook' | 'section' | 'note';
	path: string;
}

export interface ExplorerHost {
	app: App;
	pluginData: PluginData;
	selection: Selection;
	expanded: Set<string>;
	justOpened: string | null;
	closing: Set<string>;
	searchQuery: string;
	setSearchQuery(query: string): void;
	collapsedSections: Set<string>;
	actions: FileActions;
	selectNotebook(notebook: Notebook): void;
	selectSection(notebook: Notebook, section: SectionRef): void;
	toggleNotebook(notebook: Notebook): void;
	closeNotebook(notebook: Notebook): void;
	setFocus(folder: TFolder): void;
	toggleFocus(): void;
	collapseAll(): void;
	clearFocus(): void;
	reopenNotebook(notebook: Notebook): void;
	toggleSection(notebook: Notebook, section: Section): void;
	persist(): Promise<void>;
	refresh(): void;
}
