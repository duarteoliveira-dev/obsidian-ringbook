import { ItemView, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { NO_SECTION } from '../types';
import type { ExplorerHost, Notebook, Section, SectionRef, Selection } from '../types';
import type RingbookPlugin from '../main';
import { VIEW_TYPE_NOTEBOOK_EXPLORER, RIBBON_ICON } from '../utils/constants';
import { FileActions } from '../utils/file-actions';
import { remapPath, sortItems } from '../utils/order-store';
import { createScheduler } from '../utils/refresh-scheduler';
import { getFolder, getLooseFiles, getNotebooks, getSections } from '../utils/vault-tree';
import { NoteListRenderer } from './note-list-renderer';
import { attachResizer } from './resize-handle';
import { TreeRenderer } from './tree-renderer';

export class NotebookExplorerView extends ItemView implements ExplorerHost {
	selection: Selection = { notebookPath: null, sectionPath: null };
	expanded = new Set<string>();
	justOpened: string | null = null;
	closing = new Set<string>();
	collapsedSections = new Set<string>();
	searchQuery = '';
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
		this.applyLayout();
		attachResizer(
			handle,
			contentEl,
			() => this.isStacked(),
			(size) => this.applyTreeSize(size),
			(size) => {
				if (this.isStacked()) this.pluginData.treeHeight = size;
				else this.pluginData.treeWidth = size;
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
		if (section !== NO_SECTION && section.parent && section.parent !== notebook) {
			this.collapsedSections.delete(section.parent.path);
		}
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
		const { focusPath } = this.pluginData;
		if (focusPath && !file.path.startsWith(`${focusPath}/`)) {
			this.schedule();
			return;
		}
		const [notebookName, sectionName, ...rest] = file.path.split('/');
		const notebook = getFolder(this.app.vault, notebookName ?? null);
		if (!notebook || !sectionName || this.pluginData.hiddenNotebooks.includes(notebook.path)) {
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

	setFocus(folder: TFolder): void {
		const [notebookName, sectionName] = folder.path.split('/');
		const notebook = getFolder(this.app.vault, notebookName ?? null);
		if (!notebook || folder.path.split('/').length > 3) return;
		this.pluginData.focusPath = folder.path;
		if (sectionName) this.selectSection(notebook, folder);
		else this.selectNotebook(notebook);
	}

	collapseAll(): void {
		this.expanded.clear();
		for (const notebook of getNotebooks(this.app.vault)) {
			for (const section of getSections(notebook)) {
				if (getSections(section).length > 0) this.collapsedSections.add(section.path);
			}
		}
		this.render();
	}

	clearFocus(): void {
		if (!this.pluginData.focusPath) return;
		this.pluginData.focusPath = null;
		void this.persist();
		this.render();
	}

	toggleFocus(): void {
		if (this.pluginData.focusPath) {
			this.clearFocus();
			return;
		}
		const { notebookPath, sectionPath } = this.selection;
		const target = getFolder(
			this.app.vault,
			sectionPath && sectionPath !== NO_SECTION ? sectionPath : notebookPath,
		);
		if (target) this.setFocus(target);
	}

	private normalizeFocus(): void {
		const path = this.pluginData.focusPath;
		if (!path) return;
		const folder = getFolder(this.app.vault, path);
		const root = path.split('/')[0] ?? '';
		if (!folder || path.split('/').length > 3 || this.pluginData.hiddenNotebooks.includes(root)) {
			this.pluginData.focusPath = null;
			void this.persist();
		}
	}

	closeNotebook(notebook: Notebook): void {
		const { hiddenNotebooks } = this.pluginData;
		if (!hiddenNotebooks.includes(notebook.path)) hiddenNotebooks.push(notebook.path);
		this.expanded.delete(notebook.path);
		if (this.pluginData.focusPath === notebook.path) this.pluginData.focusPath = null;
		void this.persist();
		this.render();
	}

	reopenNotebook(notebook: Notebook): void {
		const { pluginData } = this;
		pluginData.hiddenNotebooks = pluginData.hiddenNotebooks.filter((p) => p !== notebook.path);
		this.selectNotebook(notebook);
	}

	setSearchQuery(query: string): void {
		this.searchQuery = query;
		this.schedule();
	}

	toggleSection(notebook: Notebook, section: Section): void {
		if (this.collapsedSections.has(section.path)) {
			this.collapsedSections.delete(section.path);
			this.justOpened = section.path;
			this.selectSection(notebook, section);
			return;
		}
		this.collapseWrapper('onb-subsections', section.path, () => {
			this.collapsedSections.add(section.path);
			this.selectSection(notebook, section);
		});
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
		this.collapseWrapper('onb-sections', notebook.path, () => {
			this.expanded.delete(notebook.path);
			this.render();
		});
	}

	private collapseWrapper(cls: string, path: string, finish: () => void): void {
		const wrapper = Array.from(
			this.contentEl.querySelectorAll<HTMLElement>(`.${cls}`),
		).find((el) => el.dataset.onbPath === path);
		if (!wrapper || activeWindow.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			finish();
			return;
		}
		if (wrapper.hasClass('is-closing')) return;
		wrapper.removeClass('is-opening');
		wrapper.addClass('is-closing');
		let done = false;
		const once = () => {
			if (done) return;
			done = true;
			finish();
		};
		wrapper.addEventListener(
			'animationend',
			(evt) => {
				if (evt.target === wrapper) once();
			},
			{ once: false },
		);
		window.setTimeout(once, 300);
	}

	async persist(): Promise<void> {
		await this.plugin.savePluginData();
	}

	private isStacked(): boolean {
		return this.pluginData.settings.panelLayout === 'stacked';
	}

	private applyTreeSize(size: number | null): void {
		const prop = this.isStacked() ? '--onb-tree-height' : '--onb-tree-width';
		this.contentEl.setCssProps({ [prop]: size ? `${size}px` : '50%' });
	}

	private applyLayout(): void {
		const stacked = this.isStacked();
		this.contentEl.toggleClass('is-stacked', stacked);
		const { treeWidth, treeHeight } = this.pluginData;
		this.contentEl.setCssProps({
			'--onb-tree-width': treeWidth ? `${treeWidth}px` : '45%',
			'--onb-tree-height': treeHeight ? `${treeHeight}px` : '50%',
		});
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
		this.collapsedSections = new Set(
			[...this.collapsedSections].map((p) => remapPath(p, oldPath, newPath)),
		);
		const { focusPath } = this.pluginData;
		if (focusPath) this.pluginData.focusPath = remapPath(focusPath, oldPath, newPath);
		this.pluginData.lastNotebookPath = nextNotebook;
		this.pluginData.lastSectionPath = nextSection;
	}

	private normalizeSelection(): void {
		const { vault } = this.app;
		const notebook = getFolder(vault, this.selection.notebookPath);
		if (!notebook || this.pluginData.hiddenNotebooks.includes(notebook.path)) {
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
		this.applyLayout();
		this.normalizeFocus();
		this.normalizeSelection();
		this.tree.render();
		this.justOpened = null;
		this.notes.render();
	}
}
