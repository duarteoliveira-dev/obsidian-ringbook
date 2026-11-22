import { addIcon } from 'obsidian';
import { NOTEBOOK_ICON } from './constants';

// Obsidian custom icons use a 100x100 viewBox and must draw with currentColor.
const RINGBOOK_SVG = `
<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
	<rect x="24" y="10" width="58" height="80" rx="8" />
	<path d="M12 28h24M12 50h24M12 72h24" />
	<path d="M52 34h18" />
</g>`;

export function registerIcons(): void {
	addIcon(NOTEBOOK_ICON, RINGBOOK_SVG);
}
