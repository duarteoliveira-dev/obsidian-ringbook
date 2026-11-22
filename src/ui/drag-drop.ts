import type { DragPayload } from '../types';
import { DRAG_MIME } from '../utils/constants';

export type DropZone = 'before' | 'after' | 'into';
export type DropMode = 'reorder' | 'into' | 'both';

const ZONE_CLASSES = ['is-drop-before', 'is-drop-after', 'is-drop-into'];

// dataTransfer contents are unreadable during dragover, so the payload is kept here
let currentDrag: DragPayload | null = null;

export function makeDraggable(el: HTMLElement, payload: DragPayload): void {
	el.draggable = true;
	el.addEventListener('dragstart', (evt) => {
		evt.stopPropagation();
		currentDrag = payload;
		evt.dataTransfer?.setData(DRAG_MIME, JSON.stringify(payload));
		if (evt.dataTransfer) evt.dataTransfer.effectAllowed = 'move';
		el.addClass('is-dragging');
	});
	el.addEventListener('dragend', () => {
		currentDrag = null;
		el.removeClass('is-dragging');
	});
}

function zoneFor(evt: DragEvent, el: HTMLElement, mode: DropMode): DropZone {
	if (mode === 'into') return 'into';
	const rect = el.getBoundingClientRect();
	const ratio = (evt.clientY - rect.top) / rect.height;
	if (mode === 'both') {
		if (ratio < 0.25) return 'before';
		if (ratio > 0.75) return 'after';
		return 'into';
	}
	return ratio < 0.5 ? 'before' : 'after';
}

function clearZone(el: HTMLElement): void {
	el.removeClass(...ZONE_CLASSES);
}

export function attachDropTarget(
	el: HTMLElement,
	opts: {
		mode: (payload: DragPayload) => DropMode | null;
		onDrop: (payload: DragPayload, zone: DropZone) => void | Promise<void>;
	},
): void {
	el.addEventListener('dragover', (evt) => {
		if (!currentDrag) return;
		const mode = opts.mode(currentDrag);
		if (!mode) return;
		evt.preventDefault();
		evt.stopPropagation();
		if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'move';
		clearZone(el);
		el.addClass(`is-drop-${zoneFor(evt, el, mode)}`);
	});
	el.addEventListener('dragleave', (evt) => {
		if (evt.relatedTarget instanceof Node && el.contains(evt.relatedTarget)) return;
		clearZone(el);
	});
	el.addEventListener('drop', (evt) => {
		clearZone(el);
		if (!currentDrag) return;
		const mode = opts.mode(currentDrag);
		if (!mode) return;
		evt.preventDefault();
		evt.stopPropagation();
		const payload = currentDrag;
		currentDrag = null;
		void opts.onDrop(payload, zoneFor(evt, el, mode));
	});
}
