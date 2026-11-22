import { Plugin } from 'obsidian';
import { revealNotebookExplorer } from './commands/reveal-view';
import {
	DEFAULT_DATA,
	DEFAULT_SETTINGS,
	OnenoteNotebookSettingTab,
} from './settings';
import type { PluginData } from './types';
import { NotebookExplorerView } from './ui/notebook-explorer-view';
import {
	COMMAND_OPEN_EXPLORER,
	RIBBON_ICON,
	VIEW_TYPE_NOTEBOOK_EXPLORER,
} from './utils/constants';
import { registerOrderMigration } from './utils/order-store';

export default class OnenoteNotebookPlugin extends Plugin {
	pluginData!: PluginData;

	async onload() {
		await this.loadPluginData();

		this.registerView(
			VIEW_TYPE_NOTEBOOK_EXPLORER,
			(leaf) => new NotebookExplorerView(leaf, this),
		);
		registerOrderMigration(this);

		this.addRibbonIcon(RIBBON_ICON, 'Open notebook explorer', () => {
			void revealNotebookExplorer(this);
		});
		this.addCommand({
			id: COMMAND_OPEN_EXPLORER,
			name: 'Open notebook explorer',
			callback: () => void revealNotebookExplorer(this),
		});
		this.addSettingTab(new OnenoteNotebookSettingTab(this.app, this));
	}

	async loadPluginData() {
		const saved = (await this.loadData()) as Partial<PluginData> | null;
		this.pluginData = {
			...DEFAULT_DATA,
			...saved,
			settings: { ...DEFAULT_SETTINGS, ...saved?.settings },
			order: saved?.order ?? {},
		};
	}

	async savePluginData() {
		await this.saveData(this.pluginData);
	}
}
