import { Notice, TAbstractFile, TFile, TFolder } from 'obsidian';
import { ConfirmModal } from '../ui/confirm-modal';
import { PromptModal } from '../ui/create-item-modal';
import { NO_SECTION } from '../types';
import type { ExplorerHost, Notebook } from '../types';
import { getFolder, joinPath } from './vault-tree';
import { insertOrder } from './order-store';

const INVALID_NAME = /[\\/:*?"<>|]/;

export class FileActions {
	constructor(private host: ExplorerHost) {}

	private get app() {
		return this.host.app;
	}

	private promptName(opts: {
		title: string;
		placeholder: string;
		initialValue?: string;
		submitLabel: string;
		parent: TFolder;
		ext?: string;
		onSubmit: (name: string) => void | Promise<void>;
	}): void {
		const ext = opts.ext ?? '';
		new PromptModal(this.app, {
			title: opts.title,
			placeholder: opts.placeholder,
			initialValue: opts.initialValue ?? '',
			submitLabel: opts.submitLabel,
			validate: (value) => {
				if (!value) return 'Enter a name.';
				if (INVALID_NAME.test(value)) return 'The name contains invalid characters.';
				const taken = opts.parent.children.some(
					(c) => c.name.toLowerCase() === `${value}${ext}`.toLowerCase(),
				);
				return taken ? 'An item with this name already exists.' : null;
			},
			onSubmit: opts.onSubmit,
		}).open();
	}

	newNotebook(): void {
		this.promptName({
			title: 'New notebook',
			placeholder: 'Notebook name',
			submitLabel: 'Create',
			parent: this.app.vault.getRoot(),
			onSubmit: async (name) => {
				const folder = await this.app.vault.createFolder(name);
				this.host.selectNotebook(folder);
			},
		});
	}

	newSection(notebook: Notebook, parent: TFolder = notebook): void {
		const isSub = parent !== notebook;
		this.promptName({
			title: isSub ? 'New folder' : 'New section',
			placeholder: isSub ? 'Folder name' : 'Section name',
			submitLabel: 'Create',
			parent,
			onSubmit: async (name) => {
				const folder = await this.app.vault.createFolder(joinPath(parent.path, name));
				this.host.selectSection(notebook, folder);
			},
		});
	}

	newNote(notebook: Notebook, sectionPath: string): void {
		const parent =
			sectionPath === NO_SECTION ? notebook : getFolder(this.app.vault, sectionPath);
		if (!parent) return;
		this.promptName({
			title: 'New note',
			placeholder: 'Note name',
			submitLabel: 'Create',
			parent,
			ext: '.md',
			onSubmit: async (name) => {
				const file = await this.app.vault.create(joinPath(parent.path, `${name}.md`), '');
				this.host.selectSection(notebook, parent === notebook ? NO_SECTION : parent);
				await this.app.workspace.getLeaf(false).openFile(file);
			},
		});
	}

	private availablePath(parent: TFolder, base: string, ext = ''): string {
		const taken = (name: string) =>
			parent.children.some((c) => c.name.toLowerCase() === `${name}${ext}`.toLowerCase());
		let name = base;
		for (let n = 1; taken(name); n++) name = `${base} ${n}`;
		return joinPath(parent.path, `${name}${ext}`);
	}

	async newUntitledNote(notebook: Notebook, section: TFolder): Promise<void> {
		const file = await this.app.vault.create(this.availablePath(section, 'Untitled', '.md'), '');
		this.host.selectSection(notebook, section);
		await this.app.workspace.getLeaf(false).openFile(file);
	}

	async copy(file: TAbstractFile): Promise<void> {
		const parent = file.parent;
		if (!parent) return;
		const ext = file instanceof TFile && file.extension ? `.${file.extension}` : '';
		const base = file instanceof TFile ? file.basename : file.name;
		await this.app.vault.copy(file, this.availablePath(parent, base, ext));
	}

	rename(file: TAbstractFile): void {
		const parent = file.parent;
		if (!parent) return;
		const ext = file instanceof TFile && file.extension ? `.${file.extension}` : '';
		const current = file instanceof TFile ? file.basename : file.name;
		this.promptName({
			title: 'Rename',
			placeholder: 'New name',
			initialValue: current,
			submitLabel: 'Rename',
			parent,
			ext,
			onSubmit: async (name) => {
				if (name === current) return;
				await this.app.fileManager.renameFile(file, joinPath(parent.path, `${name}${ext}`));
			},
		});
	}

	remove(file: TAbstractFile): void {
		const extra = file instanceof TFolder ? ' and everything inside it' : '';
		new ConfirmModal(
			this.app,
			'Delete',
			`Delete "${file.name}"${extra}?`,
			'Delete',
			() => this.app.fileManager.trashFile(file),
		).open();
	}

	async moveInto(file: TAbstractFile, folder: TFolder): Promise<boolean> {
		if (file.parent === folder) return true;
		const target = joinPath(folder.path, file.name);
		if (this.app.vault.getAbstractFileByPath(target)) {
			new Notice(`"${file.name}" already exists in "${folder.name}".`);
			return false;
		}
		await this.app.fileManager.renameFile(file, target);
		return true;
	}

	async reorder(opts: {
		moved: TAbstractFile;
		target: TAbstractFile;
		zone: 'before' | 'after';
		siblings: TAbstractFile[];
		key: string;
		moveTo: TFolder | null;
	}): Promise<void> {
		const { moved, target, zone, siblings, key, moveTo } = opts;
		if (moveTo && !(await this.moveInto(moved, moveTo))) return;
		const { pluginData } = this.host;
		pluginData.order[key] = insertOrder(
			siblings.map((s) => s.path),
			moved.path,
			target.path,
			zone,
		);
		await this.host.persist();
		this.host.refresh();
	}
}
