import { Menu, Notice, setIcon, TFolder } from 'obsidian';
import { NO_SECTION } from '../types';
import type { DragPayload, ExplorerHost } from '../types';
import { colorForIndex } from '../utils/colors';
import { NOTEBOOK_ICON, ROOT_ORDER_KEY } from '../utils/constants';
import { sortItems } from '../utils/order-store';
import {
	getClosedNotebooks,
	getFolder,
	getLooseFiles,
	getOpenNotebooks,
	getSections,
	subsectionsOrderKey,
} from '../utils/vault-tree';
import { showNoSectionMenu, showNotebookMenu, showSectionMenu } from './context-menu';
import { attachDropTarget, makeDraggable } from './drag-drop';

export class TreeRenderer {
	private searchEl: HTMLElement | null = null;
	private query = '';

	constructor(
		private el: HTMLElement,
		private host: ExplorerHost,
	) {}

	render(): void {
		const { app, pluginData } = this.host;
		// The search box is kept between renders so it does not lose focus while typing.
		for (const child of Array.from(this.el.children)) {
			if (child !== this.searchEl) child.remove();
		}

		const focus = getFolder(app.vault, pluginData.focusPath);
		this.query = focus ? '' : this.host.searchQuery.trim().toLowerCase();
		this.el.prepend(this.renderToolbar(!!focus));

		this.ensureSearch().toggleClass('is-hidden', !!focus);

		const list = this.el.createDiv({ cls: 'onb-list' });
		const allNotebooks = sortItems(
			getOpenNotebooks(app.vault, pluginData.hiddenNotebooks),
			ROOT_ORDER_KEY,
			pluginData.order,
		);
		if (focus) {
			this.renderFocused(list, focus, allNotebooks);
			return;
		}
		if (allNotebooks.length === 0) {
			list.createDiv({ cls: 'onb-empty', text: 'No notebooks. Create a folder to start.' });
		}
		const visible = allNotebooks.filter((n) => this.notebookVisible(n));
		if (this.query && visible.length === 0) {
			list.createDiv({ cls: 'onb-empty', text: 'No matches.' });
		}
		for (const notebook of visible) this.renderNotebook(list, notebook, allNotebooks);
		if (this.query) return;

		const closed = getClosedNotebooks(app.vault, pluginData.hiddenNotebooks);
		if (closed.length > 0) this.renderClosedFooter(closed);
	}

	private renderToolbar(focused: boolean): HTMLElement {
		const bar = createDiv({ cls: 'onb-toolbar' });
		const button = (icon: string, label: string, onClick: (evt: MouseEvent) => void) => {
			const el = bar.createDiv({
				cls: 'clickable-icon nav-action-button',
				attr: { 'aria-label': label },
			});
			setIcon(el, icon);
			el.addEventListener('click', onClick);
			return el;
		};
		button(NOTEBOOK_ICON, 'New ringbook', () => this.host.actions.newNotebook());
		button('folder-plus', 'New section or folder', (evt) => this.newSectionMenu(evt));
		button('chevrons-down-up', 'Collapse all', () => this.host.collapseAll());
		button('focus', focused ? 'Exit focus' : 'Focus on selected item', () =>
			this.host.toggleFocus(),
		).toggleClass('is-active', focused);
		return bar;
	}

	private newSectionMenu(evt: MouseEvent): void {
		const { app, selection, actions } = this.host;
		const notebook = getFolder(app.vault, selection.notebookPath);
		if (!notebook) {
			new Notice('Select a notebook first.');
			return;
		}
		const selected =
			selection.sectionPath && selection.sectionPath !== NO_SECTION
				? getFolder(app.vault, selection.sectionPath)
				: null;
		const section = selected && selected.parent !== notebook ? selected.parent : selected;
		if (!section || section === notebook) {
			actions.newSection(notebook);
			return;
		}
		const menu = new Menu();
		menu.addItem((i) =>
			i.setTitle('New section').setIcon('folder-plus').onClick(() => actions.newSection(notebook)),
		);
		menu.addItem((i) =>
			i
				.setTitle(`New folder in ${section.name}`)
				.setIcon('lucide-folder')
				.onClick(() => actions.newSection(notebook, section)),
		);
		menu.showAtMouseEvent(evt);
	}

	private ensureSearch(): HTMLElement {
		if (this.searchEl) return this.searchEl;
		const wrap = this.el.createDiv({ cls: 'onb-search search-input-container' });
		const input = wrap.createEl('input', {
			type: 'search',
			attr: { placeholder: 'Search notebooks...', spellcheck: 'false' },
		});
		const clear = wrap.createDiv({
			cls: 'search-input-clear-button',
			attr: { 'aria-label': 'Clear search' },
		});
		const update = (value: string) => {
			input.value = value;
			this.host.setSearchQuery(value);
		};
		input.value = this.host.searchQuery;
		input.addEventListener('input', () => this.host.setSearchQuery(input.value));
		input.addEventListener('keydown', (evt) => {
			if (evt.key === 'Escape' && input.value) {
				evt.preventDefault();
				update('');
			}
		});
		clear.addEventListener('click', () => {
			update('');
			input.focus();
		});
		this.searchEl = wrap;
		return wrap;
	}

	private matches(folder: TFolder): boolean {
		return folder.name.toLowerCase().includes(this.query);
	}

	private sectionVisible(section: TFolder): boolean {
		return !this.query || this.matches(section) || getSections(section).some((s) => this.matches(s));
	}

	private notebookVisible(notebook: TFolder): boolean {
		return (
			!this.query ||
			this.matches(notebook) ||
			getSections(notebook).some((s) => this.sectionVisible(s))
		);
	}

	private renderName(el: HTMLElement, name: string): void {
		const at = this.query ? name.toLowerCase().indexOf(this.query) : -1;
		if (at < 0) {
			el.setText(name);
			return;
		}
		el.appendText(name.slice(0, at));
		el.createSpan({ cls: 'onb-match', text: name.slice(at, at + this.query.length) });
		el.appendText(name.slice(at + this.query.length));
	}

	private renderFocused(list: HTMLElement, focus: TFolder, notebooks: TFolder[]): void {
		const { app, pluginData } = this.host;
		const [notebookName, sectionName] = focus.path.split('/');
		const notebook = getFolder(app.vault, notebookName ?? null);
		if (!notebook) return;
		if (!sectionName) {
			this.renderNotebook(list, notebook, notebooks, true);
			return;
		}
		const sections = sortItems(getSections(notebook), notebook.path, pluginData.order);
		const firstColor = pluginData.settings.firstSectionColor;
		const parent = focus.parent;
		if (parent && parent !== notebook) {
			const subs = sortItems(getSections(parent), subsectionsOrderKey(parent), pluginData.order);
			const color = colorForIndex(firstColor, sections.indexOf(parent));
			this.renderSection(list, notebook, focus, subs, color, parent);
			return;
		}
		const color = colorForIndex(firstColor, sections.indexOf(focus));
		this.renderSection(list, notebook, focus, sections, color);
	}

	private renderClosedFooter(closed: TFolder[]): void {
		const footer = this.el.createDiv({ cls: 'onb-closed-footer' });
		const icon = footer.createSpan({ cls: 'onb-closed-icon' });
		setIcon(icon, 'eye-off');
		footer.createSpan({ text: `Closed notebooks (${closed.length})` });
		footer.addEventListener('click', (evt) => {
			const menu = new Menu();
			menu.addItem((i) => i.setTitle('Reopen a notebook').setIsLabel(true));
			for (const notebook of closed) {
				menu.addItem((i) =>
					i
						.setTitle(notebook.name)
						.setIcon('book-open')
						.onClick(() => this.host.reopenNotebook(notebook)),
				);
			}
			menu.showAtMouseEvent(evt);
		});
	}

	private renderNotebook(
		list: HTMLElement,
		notebook: TFolder,
		notebooks: TFolder[],
		focused = false,
	): void {
		const { selection, expanded, actions } = this.host;
		const searching = this.query !== '';
		const isExpanded = focused || searching || expanded.has(notebook.path);
		const row = list.createDiv({
			cls: 'onb-row onb-notebook',
			attr: { title: notebook.path },
		});
		row.toggleClass('is-selected', selection.notebookPath === notebook.path);

		if (!focused) {
			const chevron = row.createSpan({ cls: 'onb-chevron' });
			setIcon(chevron, isExpanded ? 'chevron-down' : 'chevron-right');
		}
		const icon = row.createSpan({ cls: 'onb-notebook-icon' });
		const { settings } = this.host.pluginData;
		if (settings.colorNotebookIcons) {
			icon.style.setProperty(
				'--onb-icon-color',
				colorForIndex(settings.firstNotebookColor, notebooks.indexOf(notebook)),
			);
		}
		setIcon(icon, NOTEBOOK_ICON);
		this.renderName(row.createSpan({ cls: 'onb-row-title' }), notebook.name);
		const add = row.createSpan({
			cls: 'onb-row-action clickable-icon',
			attr: { 'aria-label': 'New section' },
		});
		setIcon(add, 'plus');
		add.addEventListener('click', (evt) => {
			evt.stopPropagation();
			actions.newSection(notebook);
		});

		row.addEventListener('click', () =>
			focused || searching
				? this.host.selectNotebook(notebook)
				: this.host.toggleNotebook(notebook),
		);
		row.addEventListener('contextmenu', (evt) => {
			evt.preventDefault();
			showNotebookMenu(this.host, notebook, evt);
		});
		makeDraggable(row, { type: 'notebook', path: notebook.path });
		attachDropTarget(row, {
			mode: (p) => (p.type === 'notebook' ? 'reorder' : p.type === 'section' || p.type === 'note' ? 'into' : null),
			onDrop: (payload, zone) => this.dropOnNotebook(payload, zone, notebook, notebooks),
		});

		const isClosing = !isExpanded && this.host.closing.has(notebook.path);
		if (!isExpanded && !isClosing) return;
		const sections = sortItems(getSections(notebook), notebook.path, this.host.pluginData.order);
		const wrapper = list.createDiv({
			cls: 'onb-sections',
			attr: { 'data-onb-path': notebook.path },
		});
		wrapper.toggleClass('is-opening', this.host.justOpened === notebook.path);
		wrapper.toggleClass('is-closing', isClosing);
		const inner = wrapper.createDiv({ cls: 'onb-sections-inner' });
		const showAll = !searching || this.matches(notebook);
		if (showAll && getLooseFiles(notebook).length > 0) this.renderNoSection(inner, notebook);
		sections.forEach((section, index) => {
			if (!showAll && !this.sectionVisible(section)) return;
			const color = colorForIndex(this.host.pluginData.settings.firstSectionColor, index);
			this.renderSection(inner, notebook, section, sections, color);
		});
	}

	private renderNoSection(list: HTMLElement, notebook: TFolder): void {
		const { selection } = this.host;
		const row = list.createDiv({ cls: 'onb-row onb-section onb-no-section' });
		row.toggleClass(
			'is-selected',
			selection.notebookPath === notebook.path && selection.sectionPath === NO_SECTION,
		);
		row.createSpan({ cls: 'onb-row-title', text: '(No section)' });
		row.addEventListener('click', () => this.host.selectSection(notebook, NO_SECTION));
		row.addEventListener('contextmenu', (evt) => {
			evt.preventDefault();
			showNoSectionMenu(this.host, notebook, evt);
		});
		attachDropTarget(row, {
			mode: (p) => (p.type === 'note' ? 'into' : null),
			onDrop: async (payload) => {
				const file = this.host.app.vault.getAbstractFileByPath(payload.path);
				if (file) await this.host.actions.moveInto(file, notebook);
			},
		});
	}

	private renderSection(
		list: HTMLElement,
		notebook: TFolder,
		section: TFolder,
		sections: TFolder[],
		color: string,
		parentSection: TFolder | null = null,
	): void {
		const { selection } = this.host;
		const row = list.createDiv({
			cls: parentSection ? 'onb-row onb-section onb-subsection' : 'onb-row onb-section',
			attr: { title: section.path },
		});
		row.style.setProperty('--onb-chip', color);
		row.toggleClass('is-selected', selection.sectionPath === section.path);

		const subs = parentSection
			? []
			: sortItems(getSections(section), subsectionsOrderKey(section), this.host.pluginData.order);
		const searching = this.query !== '';
		const isCollapsed = !searching && this.host.collapsedSections.has(section.path);
		row.toggleClass('has-subsections', subs.length > 0);
		if (subs.length > 0) {
			const chevron = row.createSpan({
				cls: 'onb-section-chevron',
				attr: { 'aria-label': isCollapsed ? 'Expand folders' : 'Collapse folders' },
			});
			setIcon(chevron, isCollapsed ? 'chevron-right' : 'chevron-down');
		}
		this.renderName(row.createSpan({ cls: 'onb-row-title' }), section.name);

		row.addEventListener('click', () => {
			if (subs.length > 0 && !searching) this.host.toggleSection(notebook, section);
			else this.host.selectSection(notebook, section);
		});
		row.addEventListener('contextmenu', (evt) => {
			evt.preventDefault();
			showSectionMenu(this.host, notebook, section, evt);
		});
		makeDraggable(row, { type: 'section', path: section.path });
		attachDropTarget(row, {
			mode: (p) => {
				if (p.type === 'note') return 'into';
				if (p.type !== 'section' || p.path === section.path) return null;
				if (parentSection && !sections.some((s) => s.path === p.path)) return null;
				return 'reorder';
			},
			onDrop: (payload, zone) =>
				this.dropOnSection(payload, zone, notebook, section, sections, parentSection),
		});

		if (parentSection || isCollapsed || subs.length === 0) return;
		const wrapper = list.createDiv({
			cls: 'onb-subsections',
			attr: { 'data-onb-path': section.path },
		});
		wrapper.toggleClass('is-opening', this.host.justOpened === section.path);
		const inner = wrapper.createDiv({ cls: 'onb-sections-inner' });
		const shown = searching && !this.matches(section) ? subs.filter((s) => this.matches(s)) : subs;
		for (const sub of shown) this.renderSection(inner, notebook, sub, subs, color, section);
	}

	private async dropOnNotebook(
		payload: DragPayload,
		zone: string,
		notebook: TFolder,
		notebooks: TFolder[],
	): Promise<void> {
		const { app, actions } = this.host;
		const moved = app.vault.getAbstractFileByPath(payload.path);
		if (!moved || moved === notebook) return;
		if (payload.type === 'notebook' && (zone === 'before' || zone === 'after')) {
			await actions.reorder({
				moved,
				target: notebook,
				zone,
				siblings: notebooks,
				key: ROOT_ORDER_KEY,
				moveTo: null,
			});
			return;
		}
		if ((await actions.moveInto(moved, notebook)) && moved instanceof TFolder) {
			this.host.selectSection(notebook, moved);
		}
	}

	private async dropOnSection(
		payload: DragPayload,
		zone: string,
		notebook: TFolder,
		section: TFolder,
		sections: TFolder[],
		parentSection: TFolder | null,
	): Promise<void> {
		const { app, actions } = this.host;
		const moved = app.vault.getAbstractFileByPath(payload.path);
		if (!moved || moved === section) return;
		if (payload.type === 'note') {
			await actions.moveInto(moved, section);
			return;
		}
		if (zone !== 'before' && zone !== 'after') return;
		await actions.reorder({
			moved,
			target: section,
			zone,
			siblings: sections,
			key: parentSection ? subsectionsOrderKey(parentSection) : notebook.path,
			moveTo: moved.parent === (parentSection ?? notebook) ? null : (parentSection ?? notebook),
		});
	}
}
