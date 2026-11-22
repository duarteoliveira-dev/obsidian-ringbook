import { setIcon, TFolder } from 'obsidian';
import { NO_SECTION } from '../types';
import type { DragPayload, ExplorerHost } from '../types';
import { colorForIndex } from '../utils/colors';
import { NOTEBOOK_ICON, ROOT_ORDER_KEY } from '../utils/constants';
import { sortItems } from '../utils/order-store';
import { getLooseFiles, getNotebooks, getSections, subsectionsOrderKey } from '../utils/vault-tree';
import { showNoSectionMenu, showNotebookMenu, showSectionMenu } from './context-menu';
import { attachDropTarget, makeDraggable } from './drag-drop';

export class TreeRenderer {
	constructor(
		private el: HTMLElement,
		private host: ExplorerHost,
	) {}

	render(): void {
		const { app, pluginData, actions } = this.host;
		this.el.empty();

		const header = this.el.createDiv({ cls: 'onb-col-header' });
		header.createSpan({ cls: 'onb-col-title', text: 'Notebooks' });
		const add = header.createSpan({
			cls: 'clickable-icon',
			attr: { 'aria-label': 'New notebook' },
		});
		setIcon(add, 'plus');
		add.addEventListener('click', () => actions.newNotebook());

		const list = this.el.createDiv({ cls: 'onb-list' });
		const notebooks = sortItems(getNotebooks(app.vault), ROOT_ORDER_KEY, pluginData.order);
		if (notebooks.length === 0) {
			list.createDiv({ cls: 'onb-empty', text: 'No notebooks. Create a folder to start.' });
		}
		for (const notebook of notebooks) this.renderNotebook(list, notebook, notebooks);
	}

	private renderNotebook(list: HTMLElement, notebook: TFolder, notebooks: TFolder[]): void {
		const { selection, expanded, actions } = this.host;
		const isExpanded = expanded.has(notebook.path);
		const row = list.createDiv({
			cls: 'onb-row onb-notebook',
			attr: { title: notebook.path },
		});
		row.toggleClass('is-selected', selection.notebookPath === notebook.path);

		const chevron = row.createSpan({ cls: 'onb-chevron' });
		setIcon(chevron, isExpanded ? 'chevron-down' : 'chevron-right');
		const icon = row.createSpan({ cls: 'onb-notebook-icon' });
		const { settings } = this.host.pluginData;
		if (settings.colorNotebookIcons) {
			icon.style.setProperty(
				'--onb-icon-color',
				colorForIndex(settings.firstNotebookColor, notebooks.indexOf(notebook)),
			);
		}
		setIcon(icon, NOTEBOOK_ICON);
		row.createSpan({ cls: 'onb-row-title', text: notebook.name });
		const add = row.createSpan({
			cls: 'onb-row-action clickable-icon',
			attr: { 'aria-label': 'New section' },
		});
		setIcon(add, 'plus');
		add.addEventListener('click', (evt) => {
			evt.stopPropagation();
			actions.newSection(notebook);
		});

		row.addEventListener('click', () => this.host.toggleNotebook(notebook));
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
			attr: { 'data-path': notebook.path },
		});
		wrapper.toggleClass('is-opening', this.host.justOpened === notebook.path);
		wrapper.toggleClass('is-closing', isClosing);
		const inner = wrapper.createDiv({ cls: 'onb-sections-inner' });
		if (getLooseFiles(notebook).length > 0) this.renderNoSection(inner, notebook);
		sections.forEach((section, index) => {
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
		row.createSpan({ cls: 'onb-row-title', text: section.name });

		row.addEventListener('click', () => this.host.selectSection(notebook, section));
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

		if (parentSection) return;
		const subs = sortItems(getSections(section), subsectionsOrderKey(section), this.host.pluginData.order);
		for (const sub of subs) this.renderSection(list, notebook, sub, subs, color, section);
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
