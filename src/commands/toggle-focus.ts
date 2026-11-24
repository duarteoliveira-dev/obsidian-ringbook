import type RingbookPlugin from '../main';
import { NotebookExplorerView } from '../ui/notebook-explorer-view';
import { COMMAND_TOGGLE_FOCUS, VIEW_TYPE_NOTEBOOK_EXPLORER } from '../utils/constants';

export function registerToggleFocusCommand(plugin: RingbookPlugin): void {
	plugin.addCommand({
		id: COMMAND_TOGGLE_FOCUS,
		name: 'Toggle focus on selected item',
		callback: () => {
			for (const leaf of plugin.app.workspace.getLeavesOfType(VIEW_TYPE_NOTEBOOK_EXPLORER)) {
				if (leaf.view instanceof NotebookExplorerView) leaf.view.toggleFocus();
			}
		},
	});
}
