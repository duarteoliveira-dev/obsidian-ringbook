import type { App, Plugin } from 'obsidian';
import { NotebookExplorerView } from '../ui/notebook-explorer-view';
import { VIEW_TYPE_NOTEBOOK_EXPLORER } from '../utils/constants';

export async function revealNotebookExplorer(plugin: Plugin): Promise<void> {
	const { workspace } = plugin.app;
	let leaf = workspace.getLeavesOfType(VIEW_TYPE_NOTEBOOK_EXPLORER)[0] ?? null;
	if (!leaf) {
		leaf = workspace.getLeftLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: VIEW_TYPE_NOTEBOOK_EXPLORER, active: true });
	}
	await workspace.revealLeaf(leaf);
}

export function refreshExplorerViews(app: App): void {
	for (const leaf of app.workspace.getLeavesOfType(VIEW_TYPE_NOTEBOOK_EXPLORER)) {
		if (leaf.view instanceof NotebookExplorerView) leaf.view.refresh();
	}
}
