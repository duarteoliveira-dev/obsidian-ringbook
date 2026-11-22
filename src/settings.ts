import { App, PluginSettingTab, Setting } from 'obsidian';
import type RingbookPlugin from './main';
import type { PluginData } from './types';
import { refreshExplorerViews, revealActiveNoteInViews } from './commands/reveal-view';

export type NoteSortOrder = 'alphabetical' | 'modified-desc';

export interface RingbookSettings {
	showNotesRecursively: boolean;
	noteSortOrder: NoteSortOrder;
	firstNotebookColor: string;
	firstSectionColor: string;
	autoRevealNote: boolean;
	autoCloseNotebooks: boolean;
	colorNotebookIcons: boolean;
	notebookFontSize: number;
	noteFontSize: number;
}

interface VaultConfigAccess {
	getConfig(key: string): unknown;
	setConfig(key: string, value: unknown): void;
}

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const DEFAULT_SETTINGS: RingbookSettings = {
	showNotesRecursively: true,
	noteSortOrder: 'alphabetical',
	firstNotebookColor: '#ffffff',
	firstSectionColor: '#ffffff',
	autoRevealNote: false,
	autoCloseNotebooks: false,
	colorNotebookIcons: true,
	notebookFontSize: 13,
	noteFontSize: 13,
};

export const DEFAULT_DATA: PluginData = {
	settings: DEFAULT_SETTINGS,
	order: {},
	lastNotebookPath: null,
	lastSectionPath: null,
	treeWidth: null,
};

export class RingbookSettingTab extends PluginSettingTab {
	plugin: RingbookPlugin;

	constructor(app: App, plugin: RingbookPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.pluginData.settings;
		const vaultConfig = this.app.vault as unknown as VaultConfigAccess;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Hide ribbon panel')
			.setDesc('A shortcut for the built-in show ribbon option in the interface settings.')
			.addToggle((toggle) =>
				toggle.setValue(vaultConfig.getConfig('showRibbon') === false).onChange((value) => {
					vaultConfig.setConfig('showRibbon', !value);
				}),
			);

		new Setting(containerEl)
			.setName('Include nested folders')
			.setDesc(
				'Show notes from folders nested inside a section. When off, only files directly in the section are listed.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.showNotesRecursively)
					.onChange(async (value) => {
						settings.showNotesRecursively = value;
						await this.plugin.savePluginData();
						refreshExplorerViews(this.app);
					}),
			);

		new Setting(containerEl)
			.setName('First notebook color')
			.setDesc(
				'Color of the first notebook icon. The other notebooks get automatic colors derived from it.',
			)
			.addColorPicker((picker) =>
				picker.setValue(settings.firstNotebookColor).onChange(async (value) => {
					if (!HEX_COLOR.test(value)) return;
					settings.firstNotebookColor = value;
					await this.plugin.savePluginData();
					refreshExplorerViews(this.app);
				}),
			);

		new Setting(containerEl)
			.setName('First section color')
			.setDesc(
				'Color of the marker on the first section of each notebook. The other sections get automatic colors derived from it.',
			)
			.addColorPicker((picker) =>
				picker.setValue(settings.firstSectionColor).onChange(async (value) => {
					if (!HEX_COLOR.test(value)) return;
					settings.firstSectionColor = value;
					await this.plugin.savePluginData();
					refreshExplorerViews(this.app);
				}),
			);

		new Setting(containerEl)
			.setName('Auto reveal note')
			.setDesc('Select the notebook and section of the open note, expanding the notebook.')
			.addToggle((toggle) =>
				toggle.setValue(settings.autoRevealNote).onChange(async (value) => {
					settings.autoRevealNote = value;
					await this.plugin.savePluginData();
					if (value) revealActiveNoteInViews(this.app);
				}),
			);

		new Setting(containerEl)
			.setName('Auto close notebooks')
			.setDesc('When you open a notebook, collapse the other notebooks.')
			.addToggle((toggle) =>
				toggle.setValue(settings.autoCloseNotebooks).onChange(async (value) => {
					settings.autoCloseNotebooks = value;
					await this.plugin.savePluginData();
				}),
			);

		new Setting(containerEl)
			.setName('Color notebook icons')
			.setDesc('Give each notebook icon its own color. When off, all notebook icons use the accent color.')
			.addToggle((toggle) =>
				toggle.setValue(settings.colorNotebookIcons).onChange(async (value) => {
					settings.colorNotebookIcons = value;
					await this.plugin.savePluginData();
					refreshExplorerViews(this.app);
				}),
			);

		new Setting(containerEl)
			.setName('Notebook panel font size')
			.setDesc('Font size in pixels for notebooks and sections.')
			.addSlider((slider) =>
				slider
					.setLimits(8, 24, 1)
					.setValue(settings.notebookFontSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						settings.notebookFontSize = value;
						await this.plugin.savePluginData();
						refreshExplorerViews(this.app);
					}),
			);

		new Setting(containerEl)
			.setName('Note title font size')
			.setDesc('Font size in pixels for the note titles in the second panel.')
			.addSlider((slider) =>
				slider
					.setLimits(8, 24, 1)
					.setValue(settings.noteFontSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						settings.noteFontSize = value;
						await this.plugin.savePluginData();
						refreshExplorerViews(this.app);
					}),
			);

		new Setting(containerEl)
			.setName('Default note order')
			.setDesc('Used for notes that have not been reordered by dragging.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('alphabetical', 'Name')
					.addOption('modified-desc', 'Last modified')
					.setValue(settings.noteSortOrder)
					.onChange(async (value) => {
						settings.noteSortOrder = value as NoteSortOrder;
						await this.plugin.savePluginData();
						refreshExplorerViews(this.app);
					}),
			);
	}
}
