import { App, PluginSettingTab, Setting } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';
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

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Hide ribbon panel',
				desc: 'A shortcut for the built-in show ribbon option in the interface settings.',
				control: { type: 'toggle', key: 'hideRibbon' },
			},
			{
				name: 'Include nested folders',
				desc: 'Show notes from folders nested inside a section. When off, only files directly in the section are listed.',
				control: { type: 'toggle', key: 'showNotesRecursively' },
			},
			{
				name: 'First notebook color',
				desc: 'Color of the first notebook icon. The other notebooks get automatic colors derived from it.',
				control: { type: 'color', key: 'firstNotebookColor' },
			},
			{
				name: 'First section color',
				desc: 'Color of the marker on the first section of each notebook. The other sections get automatic colors derived from it.',
				control: { type: 'color', key: 'firstSectionColor' },
			},
			{
				name: 'Auto reveal note',
				desc: 'Select the notebook and section of the open note, expanding the notebook.',
				control: { type: 'toggle', key: 'autoRevealNote' },
			},
			{
				name: 'Auto close notebooks',
				desc: 'When you open a notebook, collapse the other notebooks.',
				control: { type: 'toggle', key: 'autoCloseNotebooks' },
			},
			{
				name: 'Color notebook icons',
				desc: 'Give each notebook icon its own color. When off, all notebook icons use the accent color.',
				control: { type: 'toggle', key: 'colorNotebookIcons' },
			},
			{
				name: 'Notebook panel font size',
				desc: 'Font size in pixels for notebooks and sections.',
				control: { type: 'slider', key: 'notebookFontSize', min: 8, max: 24, step: 1 },
			},
			{
				name: 'Note title font size',
				desc: 'Font size in pixels for the note titles in the second panel.',
				control: { type: 'slider', key: 'noteFontSize', min: 8, max: 24, step: 1 },
			},
			{
				name: 'Default note order',
				desc: 'Used for notes that have not been reordered by dragging.',
				control: {
					type: 'dropdown',
					key: 'noteSortOrder',
					options: { alphabetical: 'Name', 'modified-desc': 'Last modified' },
				},
			},
		];
	}

	getControlValue(key: string): unknown {
		if (key === 'hideRibbon') {
			const vaultConfig = this.app.vault as unknown as VaultConfigAccess;
			return vaultConfig.getConfig('showRibbon') === false;
		}
		return (this.plugin.pluginData.settings as unknown as Record<string, unknown>)[key];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (key === 'hideRibbon') {
			const vaultConfig = this.app.vault as unknown as VaultConfigAccess;
			vaultConfig.setConfig('showRibbon', !value);
			return;
		}
		if (!(key in DEFAULT_SETTINGS)) return;
		if (typeof value === 'string' && key.endsWith('Color') && !HEX_COLOR.test(value)) return;
		(this.plugin.pluginData.settings as unknown as Record<string, unknown>)[key] = value;
		await this.plugin.savePluginData();
		if (key === 'autoRevealNote') {
			if (value) revealActiveNoteInViews(this.app);
		} else if (key !== 'autoCloseNotebooks') {
			refreshExplorerViews(this.app);
		}
	}

	// Fallback for Obsidian versions older than 1.13, which ignore getSettingDefinitions().
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
