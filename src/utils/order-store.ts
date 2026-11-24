import { Plugin, TAbstractFile, TFile } from 'obsidian';
import type { NoteSortOrder } from '../settings';
import type { PluginData } from '../types';

export function sortItems<T extends TAbstractFile>(
	items: T[],
	key: string,
	order: Record<string, string[]>,
	mode: NoteSortOrder = 'alphabetical',
): T[] {
	const base = [...items].sort((a, b) => {
		if (mode === 'modified-desc' && a instanceof TFile && b instanceof TFile) {
			return b.stat.mtime - a.stat.mtime;
		}
		return a.name.localeCompare(b.name, undefined, { numeric: true });
	});
	const stored = order[key];
	if (!stored) return base;
	const index = new Map(stored.map((p, i) => [p, i]));
	const listed = base
		.filter((i) => index.has(i.path))
		.sort((a, b) => (index.get(a.path) ?? 0) - (index.get(b.path) ?? 0));
	const rest = base.filter((i) => !index.has(i.path));
	return [...listed, ...rest];
}

export function insertOrder(
	currentPaths: string[],
	movedPath: string,
	targetPath: string,
	zone: 'before' | 'after',
): string[] {
	const paths = currentPaths.filter((p) => p !== movedPath);
	const at = paths.indexOf(targetPath);
	if (at < 0) return [...paths, movedPath];
	paths.splice(zone === 'before' ? at : at + 1, 0, movedPath);
	return paths;
}

export function remapPath(path: string, oldPath: string, newPath: string): string {
	if (path === oldPath) return newPath;
	if (path.startsWith(`${oldPath}/`)) return newPath + path.slice(oldPath.length);
	return path;
}

export function migrateOnRename(
	order: Record<string, string[]>,
	oldPath: string,
	newPath: string,
): Record<string, string[]> {
	const next: Record<string, string[]> = {};
	for (const [key, paths] of Object.entries(order)) {
		next[remapPath(key, oldPath, newPath)] = paths.map((p) =>
			remapPath(p, oldPath, newPath),
		);
	}
	return next;
}

export function registerOrderMigration(
	plugin: Plugin & {
		pluginData: PluginData;
		savePluginData(): Promise<void>;
	},
): void {
	plugin.registerEvent(
		plugin.app.vault.on('rename', (file, oldPath) => {
			plugin.pluginData.order = migrateOnRename(
				plugin.pluginData.order,
				oldPath,
				file.path,
			);
			const { focusPath } = plugin.pluginData;
			if (focusPath) plugin.pluginData.focusPath = remapPath(focusPath, oldPath, file.path);
			plugin.pluginData.hiddenNotebooks = plugin.pluginData.hiddenNotebooks.map((p) =>
				remapPath(p, oldPath, file.path),
			);
			void plugin.savePluginData();
		}),
	);
	plugin.registerEvent(
		plugin.app.vault.on('delete', (file) => {
			const { hiddenNotebooks } = plugin.pluginData;
			if (!hiddenNotebooks.includes(file.path)) return;
			plugin.pluginData.hiddenNotebooks = hiddenNotebooks.filter((p) => p !== file.path);
			void plugin.savePluginData();
		}),
	);
}
