import { ItemView, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { NO_SECTION } from '../types';
import type { ExplorerHost, Notebook, Selection, SectionRef } from '../types';
import type RingbookPlugin from '../main';
import { VIEW_TYPE_NOTEBOOK_EXPLORER, RIBBON_ICON } from '../utils/constants';
import { FileActions } from '../utils/file-actions';
import { remapPath, sortItems } from '../utils/order-store';
import { createScheduler } from '../utils/refresh-scheduler';
import { getFolder, getLooseFiles, getSections } from '../utils/vault-tree';
import { NoteListRenderer } from './note-list-renderer';
import { attachResizer } from './resize-handle';
import { TreeRenderer } from './tree-renderer';

export class NotebookExplorerView extends ItemView implements ExplorerHost {
	selection: Selection = { notebookPath: null, sectionPath: null };
	expanded = new Set<string>();
	justOpened: string | null = null;
	closing = new Set<string>();
	private closingTimer: number | null = null;
	actions: FileActions = new FileActions(this);
	private tree!: TreeRenderer;
	private notes!: NoteListRenderer;
	private closed = false;
	private schedule = createScheduler(() => {
		if (!this.closed) this.render();
	});

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: RingbookPlugin,
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
		return 'Ringbook';
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
		const handle = contentEl.createDiv({ cls: 'onb-resizer' });
		this.applyTreeWidth(this.pluginData.treeWidth);
		attachResizer(
			handle,
			contentEl,
			(width) => this.applyTreeWidth(width),
			(width) => {
				this.pluginData.treeWidth = width;
				void this.persist();
			},
		);
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
		this.registerEvent(
			workspace.on('file-open', (file) => {
				if (file && this.pluginData.settings.autoRevealNote) this.revealNote(file);
				else this.schedule();
			}),
		);
		this.render();
	}

	async onClose() {
		this.closed = true;
	}

	refresh(): void {
		this.schedule();
	}

	selectNotebook(notebook: Notebook): void {
		this.expand(notebook);
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
		this.expand(notebook);
		this.selection = {
			notebookPath: notebook.path,
			sectionPath: section === NO_SECTION ? NO_SECTION : section.path,
		};
		this.commitSelection();
	}

	revealActiveNote(): void {
		const file = this.app.workspace.getActiveFile();
		if (file) this.revealNote(file);
	}

	private revealNote(file: TFile): void {
		const [notebookName, sectionName, ...rest] = file.path.split('/');
		const notebook = getFolder(this.app.vault, notebookName ?? null);
		if (!notebook || !sectionName) {
			this.schedule();
			return;
		}
		const sectionPath =
			rest.length > 1
				? `${notebook.path}/${sectionName}/${rest[0]}`
				: `${notebook.path}/${sectionName}`;
		const section = rest.length > 0 ? getFolder(this.app.vault, sectionPath) : null;
		const target = section ?? NO_SECTION;
		const targetPath = section ? section.path : NO_SECTION;
		if (this.selection.notebookPath === notebook.path && this.selection.sectionPath === targetPath) {
			this.schedule();
			return;
		}
		this.selectSection(notebook, target);
	}

	private expand(notebook: Notebook): void {
		if (!this.expanded.has(notebook.path)) this.justOpened = notebook.path;
		if (this.pluginData.settings.autoCloseNotebooks) {
			this.animateAutoClose(notebook);
			this.expanded.clear();
		}
		this.expanded.add(notebook.path);
	}

	toggleNotebook(notebook: Notebook): void {
		if (this.expanded.has(notebook.path)) {
			this.collapse(notebook);
		} else {
			this.selectNotebook(notebook);
		}
	}

	private animateAutoClose(keep: Notebook): void {
		if (activeWindow.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const others = [...this.expanded].filter((p) => p !== keep.path);
		if (others.length === 0) return;
		this.closing = new Set(others);
		if (this.closingTimer !== null) window.clearTimeout(this.closingTimer);
		this.closingTimer = window.setTimeout(() => {
			this.closingTimer = null;
			this.closing = new Set();
			if (!this.closed) this.render();
		}, 220);
	}

	private collapse(notebook: Notebook): void {
		const wrapper = Array.from(
			this.contentEl.querySelectorAll<HTMLElement>('.onb-sections'),
		).find((el) => el.dataset.path === notebook.path);
		const finish = () => {
			this.expanded.delete(notebook.path);
			this.render();
		};
		if (!wrapper || activeWindow.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			finish();
			return;
		}
		if (wrapper.hasClass('is-closing')) return;
		wrapper.addClass('is-closing');
		let done = false;
		const once = () => {
			if (done) return;
			done = true;
			finish();
		};
		wrapper.addEventListener('animationend', once, { once: true });
		window.setTimeout(once, 300);
	}

	async persist(): Promise<void> {
		await this.plugin.savePluginData();
	}

	private applyTreeWidth(width: number | null): void {
		this.contentEl.setCssProps({ '--onb-tree-width': width ? `${width}px` : '45%' });
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
			if (
				!(section instanceof TFolder) ||
				(section.parent !== notebook && section.parent?.parent !== notebook)
			) {
				this.selection.sectionPath = null;
			}
		}
	}

	private render(): void {
		const { notebookFontSize, noteFontSize } = this.pluginData.settings;
		this.contentEl.setCssProps({
			'--onb-tree-font-size': `${notebookFontSize}px`,
			'--onb-notes-font-size': `${noteFontSize}px`,
		});
		this.normalizeSelection();
		this.tree.render();
		this.justOpened = null;
		this.notes.render();
	}
}
