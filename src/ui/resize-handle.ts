const MIN_WIDTH = 100;

export function attachResizer(
	handle: HTMLElement,
	container: HTMLElement,
	onResize: (width: number) => void,
	onDone: (width: number) => void,
): void {
	const widthFor = (evt: PointerEvent) => {
		const rect = container.getBoundingClientRect();
		const max = Math.max(MIN_WIDTH, rect.width - MIN_WIDTH);
		return Math.round(Math.min(max, Math.max(MIN_WIDTH, evt.clientX - rect.left)));
	};

	handle.addEventListener('pointerdown', (evt) => {
		evt.preventDefault();
		handle.setPointerCapture(evt.pointerId);
		handle.addClass('is-resizing');
	});
	handle.addEventListener('pointermove', (evt) => {
		if (handle.hasPointerCapture(evt.pointerId)) onResize(widthFor(evt));
	});
	handle.addEventListener('pointerup', (evt) => {
		if (!handle.hasPointerCapture(evt.pointerId)) return;
		handle.releasePointerCapture(evt.pointerId);
		handle.removeClass('is-resizing');
		onDone(widthFor(evt));
	});
}
