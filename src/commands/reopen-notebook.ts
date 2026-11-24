import { App, FuzzySuggestModal, Notice, TFolder } from 'obsidian';
import type RingbookPlugin from '../main';
import { NotebookExplorerView } from '../ui/notebook-explorer-view';
import { COMMAND_REOPEN_NOTEBOOK, VIEW_TYPE_NOTEBOOK_EXPLORER } from '../utils/constants';
import { getClosedNotebooks } from '../utils/vault-tree';
import { revealNotebookExplorer } from './reveal-view';

class ClosedNotebookModal extends FuzzySuggestModal<TFolder> {
	constructor(
		app: App,
		private notebooks: TFolder[],
		private onChoose: (notebook: TFolder) => void,
	) {
		super(app);
		this.setPlaceholder('Reopen a closed notebook');
	}

	getItems(): TFolder[] {
		return this.notebooks;
	}

	getItemText(notebook: TFolder): string {
		return notebook.name;
	}

	onChooseItem(notebook: TFolder): void {
		this.onChoose(notebook);
	}
}

async function reopen(plugin: RingbookPlugin, notebook: TFolder): Promise<void> {
	await revealNotebookExplorer(plugin);
	const leaf = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_NOTEBOOK_EXPLORER)[0];
	if (leaf?.view instanceof NotebookExplorerView) leaf.view.reopenNotebook(notebook);
}

export function registerReopenNotebookCommand(plugin: RingbookPlugin): void {
	plugin.addCommand({
		id: COMMAND_REOPEN_NOTEBOOK,
		name: 'Reopen closed notebook',
		callback: () => {
			const closed = getClosedNotebooks(plugin.app.vault, plugin.pluginData.hiddenNotebooks);
			if (closed.length === 0) {
				new Notice('There are no closed notebooks.');
				return;
			}
			new ClosedNotebookModal(plugin.app, closed, (notebook) => void reopen(plugin, notebook)).open();
		},
	});
}
