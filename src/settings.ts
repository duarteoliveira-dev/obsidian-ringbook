import { App, PluginSettingTab, Setting } from 'obsidian';
import type OnenoteNotebookPlugin from './main';
import type { PluginData } from './types';
import { refreshExplorerViews } from './commands/reveal-view';

export type NoteSortOrder = 'alphabetical' | 'modified-desc';

export interface OnenoteNotebookSettings {
	showNotesRecursively: boolean;
	noteSortOrder: NoteSortOrder;
}

export const DEFAULT_SETTINGS: OnenoteNotebookSettings = {
	showNotesRecursively: true,
	noteSortOrder: 'alphabetical',
};

export const DEFAULT_DATA: PluginData = {
	settings: DEFAULT_SETTINGS,
	order: {},
	lastNotebookPath: null,
	lastSectionPath: null,
};

export class OnenoteNotebookSettingTab extends PluginSettingTab {
	plugin: OnenoteNotebookPlugin;

	constructor(app: App, plugin: OnenoteNotebookPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.pluginData.settings;
		containerEl.empty();

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
