const MIN_SIZE = 100;

export function attachResizer(
	handle: HTMLElement,
	container: HTMLElement,
	isVertical: () => boolean,
	onResize: (size: number) => void,
	onDone: (size: number) => void,
): void {
	const sizeFor = (evt: PointerEvent) => {
		const rect = container.getBoundingClientRect();
		const stacked = isVertical();
		const total = stacked ? rect.height : rect.width;
		const pos = stacked ? evt.clientY - rect.top : evt.clientX - rect.left;
		const max = Math.max(MIN_SIZE, total - MIN_SIZE);
		return Math.round(Math.min(max, Math.max(MIN_SIZE, pos)));
	};

	handle.addEventListener('pointerdown', (evt) => {
		evt.preventDefault();
		handle.setPointerCapture(evt.pointerId);
		handle.addClass('is-resizing');
	});
	handle.addEventListener('pointermove', (evt) => {
		if (handle.hasPointerCapture(evt.pointerId)) onResize(sizeFor(evt));
	});
	handle.addEventListener('pointerup', (evt) => {
		if (!handle.hasPointerCapture(evt.pointerId)) return;
		handle.releasePointerCapture(evt.pointerId);
		handle.removeClass('is-resizing');
		onDone(sizeFor(evt));
	});
}
