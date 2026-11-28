import { App, PluginSettingTab } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';
import type RingbookPlugin from './main';
import type { PluginData } from './types';
import { refreshExplorerViews, revealActiveNoteInViews } from './commands/reveal-view';

export type NoteSortOrder = 'alphabetical' | 'modified-desc';
export type PanelLayout = 'side-by-side' | 'stacked';

export interface RingbookSettings {
	noteSortOrder: NoteSortOrder;
	panelLayout: PanelLayout;
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
	noteSortOrder: 'alphabetical',
	panelLayout: 'side-by-side',
	firstNotebookColor: '#ffffff',
	firstSectionColor: '#d74242',
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
	treeHeight: null,
	hiddenNotebooks: [],
	focusPath: null,
};

export class RingbookSettingTab extends PluginSettingTab {
	plugin: RingbookPlugin;

	constructor(app: App, plugin: RingbookPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const { settings } = this.plugin.pluginData;
		return [
			{
				type: 'group',
				heading: 'Layout',
				items: [
					{
						name: 'Note list position',
						desc: 'Show the note list to the right of the notebooks panel, or below it.',
						control: {
							type: 'dropdown',
							key: 'panelLayout',
							options: { 'side-by-side': 'Right of notebooks', stacked: 'Below notebooks' },
						},
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
						name: 'Hide ribbon panel',
						desc: 'A shortcut for the built-in show ribbon option in the interface settings.',
						control: { type: 'toggle', key: 'hideRibbon' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Colors',
				items: [
					{
						name: 'Color notebook icons',
						desc: 'Give each notebook icon its own color. When off, all notebook icons use the accent color.',
						control: { type: 'toggle', key: 'colorNotebookIcons' },
					},
					{
						name: 'First notebook color',
						desc: 'Color of the first notebook icon. The other notebooks get automatic colors derived from it. Used only when notebook icons are colored.',
						control: {
							type: 'color',
							key: 'firstNotebookColor',
							disabled: () => !settings.colorNotebookIcons,
						},
					},
					{
						name: 'First section color',
						desc: 'Color of the marker on the first section of each notebook. The other sections get automatic colors derived from it.',
						control: { type: 'color', key: 'firstSectionColor' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Notes',
				items: [
					{
						name: 'Default note order',
						desc: 'Used for notes that have not been reordered by dragging.',
						control: {
							type: 'dropdown',
							key: 'noteSortOrder',
							options: { alphabetical: 'Name', 'modified-desc': 'Last modified' },
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Navigation',
				items: [
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
				],
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
		if (key === 'colorNotebookIcons') this.refreshDomState();
		if (key === 'autoRevealNote') {
			if (value) revealActiveNoteInViews(this.app);
		} else if (key !== 'autoCloseNotebooks') {
			refreshExplorerViews(this.app);
		}
	}
}
