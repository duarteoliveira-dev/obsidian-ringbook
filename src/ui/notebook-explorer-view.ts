import { ItemView, TFolder, WorkspaceLeaf } from 'obsidian';
import { NO_SECTION } from '../types';
import type { ExplorerHost, Notebook, Selection, SectionRef } from '../types';
import type OnenoteNotebookPlugin from '../main';
import { VIEW_TYPE_NOTEBOOK_EXPLORER, RIBBON_ICON } from '../utils/constants';
import { FileActions } from '../utils/file-actions';
import { remapPath, sortItems } from '../utils/order-store';
import { createScheduler } from '../utils/refresh-scheduler';
import { getFolder, getLooseFiles, getSections } from '../utils/vault-tree';
import { NoteListRenderer } from './note-list-renderer';
import { TreeRenderer } from './tree-renderer';

export class NotebookExplorerView extends ItemView implements ExplorerHost {
	selection: Selection = { notebookPath: null, sectionPath: null };
	expanded = new Set<string>();
	actions: FileActions = new FileActions(this);
	private tree!: TreeRenderer;
	private notes!: NoteListRenderer;
	private closed = false;
	private schedule = createScheduler(() => {
		if (!this.closed) this.render();
	});

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: OnenoteNotebookPlugin,
	) {
		super(leaf);
	}

	get pluginData() {
		return this.plugin.pluginData;
	}

	getViewType() {
		return VIEW_TYPE_NOTEBOOK_EXPLORER;
	}

	getDisplayText() {
		return 'Onenote notebook';
	}

	getIcon() {
		return RIBBON_ICON;
	}

	getState(): Record<string, unknown> {
		return { ...this.selection };
	}

	async setState(state: unknown, result: Parameters<ItemView['setState']>[1]) {
		const s = state as Partial<Selection> | null;
		if (s && (s.notebookPath || s.sectionPath)) {
			this.selection = {
				notebookPath: s.notebookPath ?? null,
				sectionPath: s.sectionPath ?? null,
			};
			if (this.selection.notebookPath) this.expanded.add(this.selection.notebookPath);
		}
		await super.setState(state, result);
		if (this.tree) this.render();
	}

	async onOpen() {
		this.closed = false;
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('onb-container');
		this.tree = new TreeRenderer(contentEl.createDiv({ cls: 'onb-tree-col' }), this);
		this.notes = new NoteListRenderer(contentEl.createDiv({ cls: 'onb-notes-col' }), this);

		if (!this.selection.notebookPath) {
			this.selection = {
				notebookPath: this.pluginData.lastNotebookPath,
				sectionPath: this.pluginData.lastSectionPath,
			};
			if (this.selection.notebookPath) this.expanded.add(this.selection.notebookPath);
		}

		const { vault, workspace } = this.app;
		this.registerEvent(vault.on('create', this.schedule));
		this.registerEvent(vault.on('delete', this.schedule));
		this.registerEvent(
			vault.on('rename', (file, oldPath) => {
				this.remapSelection(oldPath, file.path);
				this.schedule();
			}),
		);
		this.registerEvent(
			vault.on('modify', () => {
				if (this.pluginData.settings.noteSortOrder === 'modified-desc') this.schedule();
			}),
		);
		this.registerEvent(workspace.on('file-open', this.schedule));
		this.render();
	}

	async onClose() {
		this.closed = true;
	}

	refresh(): void {
		this.schedule();
	}

	selectNotebook(notebook: Notebook): void {
		this.expanded.add(notebook.path);
		if (this.selection.notebookPath !== notebook.path || !this.selection.sectionPath) {
			const first = sortItems(getSections(notebook), notebook.path, this.pluginData.order)[0];
			this.selection = {
				notebookPath: notebook.path,
				sectionPath: first
					? first.path
					: getLooseFiles(notebook).length > 0
						? NO_SECTION
						: null,
			};
		}
		this.commitSelection();
	}

	selectSection(notebook: Notebook, section: SectionRef): void {
		this.expanded.add(notebook.path);
		this.selection = {
			notebookPath: notebook.path,
			sectionPath: section === NO_SECTION ? NO_SECTION : section.path,
		};
		this.commitSelection();
	}

	toggleNotebook(notebook: Notebook): void {
		if (this.expanded.has(notebook.path)) {
			this.expanded.delete(notebook.path);
			this.render();
		} else {
			this.selectNotebook(notebook);
		}
	}

	async persist(): Promise<void> {
		await this.plugin.savePluginData();
	}

	private commitSelection(): void {
		this.pluginData.lastNotebookPath = this.selection.notebookPath;
		this.pluginData.lastSectionPath = this.selection.sectionPath;
		void this.persist();
		this.app.workspace.requestSaveLayout();
		this.render();
	}

	private remapSelection(oldPath: string, newPath: string): void {
		const { notebookPath, sectionPath } = this.selection;
		const nextSection =
			sectionPath && sectionPath !== NO_SECTION
				? remapPath(sectionPath, oldPath, newPath)
				: sectionPath;
		let nextNotebook = notebookPath ? remapPath(notebookPath, oldPath, newPath) : null;
		if (nextSection && nextSection !== NO_SECTION && nextSection !== sectionPath) {
			nextNotebook = nextSection.includes('/')
				? nextSection.slice(0, nextSection.lastIndexOf('/'))
				: nextNotebook;
		}
		this.selection = { notebookPath: nextNotebook, sectionPath: nextSection };
		this.expanded = new Set([...this.expanded].map((p) => remapPath(p, oldPath, newPath)));
		this.pluginData.lastNotebookPath = nextNotebook;
		this.pluginData.lastSectionPath = nextSection;
	}

	private normalizeSelection(): void {
		const { vault } = this.app;
		const notebook = getFolder(vault, this.selection.notebookPath);
		if (!notebook) {
			this.selection = { notebookPath: null, sectionPath: null };
			return;
		}
		const { sectionPath } = this.selection;
		if (sectionPath && sectionPath !== NO_SECTION) {
			const section = getFolder(vault, sectionPath);
			if (!(section instanceof TFolder) || section.parent !== notebook) {
				this.selection.sectionPath = null;
			}
		}
	}

	private render(): void {
		this.normalizeSelection();
		this.tree.render();
		this.notes.render();
	}
}
