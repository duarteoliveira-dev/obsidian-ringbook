import { Plugin } from 'obsidian';
import { registerToggleFocusCommand } from './commands/toggle-focus';
import { registerReopenNotebookCommand } from './commands/reopen-notebook';
import { revealNotebookExplorer } from './commands/reveal-view';
import {
	DEFAULT_DATA,
	DEFAULT_SETTINGS,
	RingbookSettingTab,
} from './settings';
import type { PluginData } from './types';
import { NotebookExplorerView } from './ui/notebook-explorer-view';
import {
	COMMAND_OPEN_EXPLORER,
	RIBBON_ICON,
	VIEW_TYPE_NOTEBOOK_EXPLORER,
} from './utils/constants';
import { registerIcons } from './utils/icons';
import { registerOrderMigration } from './utils/order-store';

export default class RingbookPlugin extends Plugin {
	pluginData!: PluginData;

	async onload() {
		registerIcons();
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
		registerReopenNotebookCommand(this);
		registerToggleFocusCommand(this);
		this.addSettingTab(new RingbookSettingTab(this.app, this));
	}

	async loadPluginData() {
		const saved = (await this.loadData()) as Partial<PluginData> | null;
		const savedSettings = saved?.settings;
		const inheritedNotebookColor =
			savedSettings?.firstSectionColor && !savedSettings.firstNotebookColor
				? { firstNotebookColor: savedSettings.firstSectionColor }
				: {};
		this.pluginData = {
			...DEFAULT_DATA,
			...saved,
			settings: { ...DEFAULT_SETTINGS, ...inheritedNotebookColor, ...savedSettings },
			order: saved?.order ?? {},
			hiddenNotebooks: [...(saved?.hiddenNotebooks ?? [])],
			focusPath: null,
		};
	}

	async savePluginData() {
		// Focus is session-only, so it is never written to disk.
		await this.saveData({ ...this.pluginData, focusPath: null });
	}
}
